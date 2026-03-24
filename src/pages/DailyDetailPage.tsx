import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { DailyDetailActionsPanel } from '../components/daily-detail/DailyDetailActionsPanel'
import { DailyDetailHeader } from '../components/daily-detail/DailyDetailHeader'
import { DailyHistoryList } from '../components/daily-detail/DailyHistoryList'
import { DailyWorkersTable } from '../components/daily-detail/DailyWorkersTable'
import { UnauthorizedError } from '../services/auth'
import {
  closeDailyTip,
  createDailyParticipation,
  deleteDailyParticipation,
  fetchAvailableWorkers,
  fetchDailyDetail,
  reopenDailyTip,
  updateDailyParticipation,
  updateDailyTip,
} from '../services/tips'
import { useAuthStore } from '../store/authStore'
import type { AvailableWorker, DailyDetailResponse, DailyParticipation } from '../types/api'

type LoadDailyDetailOptions = {
  preserveViewOnError?: boolean
}

type AsyncAction = () => Promise<void>

export function DailyDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout)
  const { dailyTipId } = useParams()
  const [dailyDetail, setDailyDetail] = useState<DailyDetailResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)
  const [isEditingTotalAmount, setIsEditingTotalAmount] = useState(false)
  const [draftTotalAmount, setDraftTotalAmount] = useState('')
  const [draftTotalAmountReason, setDraftTotalAmountReason] = useState('')
  const [isConfirmingClosedState, setIsConfirmingClosedState] = useState(false)
  const [isAddingWorker, setIsAddingWorker] = useState(false)
  const [availableWorkers, setAvailableWorkers] = useState<AvailableWorker[]>([])
  const [selectedWorkerId, setSelectedWorkerId] = useState('')
  const [draftWorkerHours, setDraftWorkerHours] = useState('0.00')
  const [draftWorkerReason, setDraftWorkerReason] = useState('')
  const [editingParticipationId, setEditingParticipationId] = useState<number | null>(null)
  const [draftEditHours, setDraftEditHours] = useState('')
  const [draftEditReason, setDraftEditReason] = useState('')
  const [deletingParticipationId, setDeletingParticipationId] = useState<number | null>(null)
  const [draftDeleteReason, setDraftDeleteReason] = useState('')
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadDailyDetail = useCallback(
    async ({ preserveViewOnError = false }: LoadDailyDetailOptions = {}) => {
      if (!isMountedRef.current) {
        return false
      }

      const parsedDailyTipId = Number(dailyTipId)

      if (!dailyTipId || Number.isNaN(parsedDailyTipId) || parsedDailyTipId <= 0) {
        if (isMountedRef.current) {
          setLoadError('El identificador del día no es válido.')
          setIsLoading(false)
        }
        return false
      }

      if (isMountedRef.current) {
        if (!preserveViewOnError) {
          setIsLoading(true)
          setLoadError(null)
        }
        setActionError(null)
      }

      try {
        const response = await fetchDailyDetail(parsedDailyTipId)
        if (isMountedRef.current) {
          setDailyDetail(response)
          setLoadError(null)
        }
        return true
      } catch (loadError) {
        if (loadError instanceof UnauthorizedError) {
          logout()
          navigate('/login', { replace: true, state: { from: location.pathname } })
          return false
        }

        if (isMountedRef.current) {
          const message =
            loadError instanceof Error ? loadError.message : 'No se pudo cargar el detalle del día.'

          if (preserveViewOnError) {
            setActionError(message)
          } else {
            setLoadError(message)
          }
        }
        return false
      } finally {
        if (isMountedRef.current && !preserveViewOnError) {
          setIsLoading(false)
        }
      }
    },
    [dailyTipId, location.pathname, logout, navigate],
  )

  useEffect(() => {
    void loadDailyDetail()
  }, [loadDailyDetail])

  useEffect(() => {
    if (!dailyDetail) {
      return
    }

    resetDetailDrafts(dailyDetail)
  }, [dailyDetail])

  function getParticipationByUserId(userId: number) {
    return dailyDetail?.participations.find((participation) => participation.user.id === userId)
  }

  function resetActionPanels() {
    setIsEditingTotalAmount(false)
    setIsConfirmingClosedState(false)
    setIsAddingWorker(false)
    setEditingParticipationId(null)
    setDeletingParticipationId(null)
  }

  function resetDetailDrafts(detail: DailyDetailResponse) {
    setDraftTotalAmount(detail.total_amount)
    setDraftTotalAmountReason('')
    resetActionPanels()
    setAvailableWorkers([])
    setSelectedWorkerId('')
    setDraftWorkerHours('0.00')
    setDraftWorkerReason('')
    setDraftEditHours('')
    setDraftEditReason('')
    setDraftDeleteReason('')
    setActionError(null)
  }

  function clearActionErrorAndCloseTopPanels() {
    setActionError(null)
    setIsEditingTotalAmount(false)
    setIsConfirmingClosedState(false)
    setIsAddingWorker(false)
  }

  function toggleEditTotalAmountPanel() {
    setActionError(null)
    setIsEditingTotalAmount((current) => {
      const nextValue = !current
      setIsConfirmingClosedState(false)
      setIsAddingWorker(false)
      return nextValue
    })
  }

  function toggleClosedStatePanel() {
    setActionError(null)
    setIsConfirmingClosedState((current) => {
      const nextValue = !current
      setIsEditingTotalAmount(false)
      setIsAddingWorker(false)
      return nextValue
    })
  }

  function handleUnauthorized() {
    logout()
    navigate('/login', { replace: true, state: { from: location.pathname } })
  }

  async function reloadAfterAction(onSuccess?: () => void) {
    const didReload = await loadDailyDetail({ preserveViewOnError: true })
    if (didReload && isMountedRef.current) {
      onSuccess?.()
    }
  }

  async function runAction(action: AsyncAction) {
    try {
      setIsSubmittingAction(true)
      setActionError(null)
      await action()
    } finally {
      if (isMountedRef.current) {
        setIsSubmittingAction(false)
      }
    }
  }

  async function handleSubmitTotalAmount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!dailyDetail) {
      return
    }

    const trimmedAmount = draftTotalAmount.trim()
    if (!trimmedAmount) {
      setActionError('El bote total no puede quedar vacío.')
      return
    }

    const parsedAmount = Number(trimmedAmount.replace(',', '.'))
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setActionError('El bote total debe ser un número válido mayor que 0.')
      return
    }

    const normalizedAmount = parsedAmount.toFixed(2)
    const changeReason = dailyDetail.is_closed ? draftTotalAmountReason.trim() : ''

    try {
      await runAction(async () => {
        await updateDailyTip(dailyDetail.id, {
          total_amount: normalizedAmount,
          change_reason: changeReason,
        })
        await reloadAfterAction(() => {
          setIsEditingTotalAmount(false)
        })
      })
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        handleUnauthorized()
        return
      }

      setActionError(
        actionError instanceof Error ? actionError.message : 'No se pudo actualizar el bote.',
      )
    }
  }

  async function handleConfirmClosedState() {
    if (!dailyDetail) {
      return
    }

    try {
      await runAction(async () => {
        if (dailyDetail.is_closed) {
          await reopenDailyTip(dailyDetail.id)
        } else {
          await closeDailyTip(dailyDetail.id)
        }

        await reloadAfterAction(() => {
          setIsConfirmingClosedState(false)
        })
      })
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        handleUnauthorized()
        return
      }

      setActionError(
        actionError instanceof Error
          ? actionError.message
          : 'No se pudo actualizar el estado del día.',
      )
    }
  }

  async function handleOpenAddWorkerForm() {
    if (!dailyDetail) {
      return
    }

    try {
      await runAction(async () => {
        const availableWorkers = await fetchAvailableWorkers(dailyDetail.id)

        if (!availableWorkers.length) {
          setActionError('No hay trabajadores disponibles para añadir a este día.')
          return
        }

        if (isMountedRef.current) {
          setAvailableWorkers(availableWorkers)
          setSelectedWorkerId(String(availableWorkers[0]?.id ?? ''))
          setDraftWorkerHours('0.00')
          setDraftWorkerReason('')
          clearActionErrorAndCloseTopPanels()
          setIsAddingWorker(true)
        }
      })
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        handleUnauthorized()
        return
      }

      setActionError(
        actionError instanceof Error
          ? actionError.message
          : 'No se pudo añadir el trabajador al día.',
      )
    }
  }

  async function handleSubmitAddWorker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!dailyDetail) {
      return
    }

    const parsedSelectedWorkerId = Number(selectedWorkerId)
    const selectedWorker = availableWorkers.find((worker) => worker.id === parsedSelectedWorkerId)
    if (!selectedWorker) {
      setActionError('Debes elegir un trabajador válido de la lista.')
      return
    }

    const parsedHours = Number(draftWorkerHours.trim().replace(',', '.'))
    if (Number.isNaN(parsedHours) || parsedHours < 0) {
      setActionError('Las horas deben ser un número válido igual o mayor que 0.')
      return
    }

    try {
      await runAction(async () => {
        await createDailyParticipation({
          daily_tip: dailyDetail.id,
          user_id: selectedWorker.id,
          hours_worked: parsedHours.toFixed(2),
          change_reason: dailyDetail.is_closed ? draftWorkerReason.trim() : '',
        })
        await reloadAfterAction(() => {
          setIsAddingWorker(false)
        })
      })
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        handleUnauthorized()
        return
      }

      setActionError(
        actionError instanceof Error
          ? actionError.message
          : 'No se pudo añadir el trabajador al día.',
      )
    }
  }

  function handleStartEditHours(participation: DailyParticipation) {
    if (editingParticipationId === participation.id) {
      setEditingParticipationId(null)
      setDraftEditHours('')
      setDraftEditReason('')
      return
    }

    setActionError(null)
    setDeletingParticipationId(null)
    setIsEditingTotalAmount(false)
    setIsConfirmingClosedState(false)
    setIsAddingWorker(false)
    setEditingParticipationId(participation.id)
    setDraftEditHours(participation.hours_worked)
    setDraftEditReason('')
  }

  async function handleSubmitEditHours(
    event: FormEvent<HTMLFormElement>,
    participation: DailyParticipation,
  ) {
    event.preventDefault()

    const parsedHours = Number(draftEditHours.trim().replace(',', '.'))
    if (Number.isNaN(parsedHours) || parsedHours < 0) {
      setActionError('Las horas deben ser un número válido igual o mayor que 0.')
      return
    }

    try {
      await runAction(async () => {
        await updateDailyParticipation(participation.id, {
          hours_worked: parsedHours.toFixed(2),
          change_reason: dailyDetail?.is_closed ? draftEditReason.trim() : '',
        })
        await reloadAfterAction(() => {
          setEditingParticipationId(null)
        })
      })
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        handleUnauthorized()
        return
      }

      setActionError(
        actionError instanceof Error ? actionError.message : 'No se pudieron actualizar las horas.',
      )
    }
  }

  function handleStartDeleteParticipation(participationId: number) {
    if (deletingParticipationId === participationId) {
      setDeletingParticipationId(null)
      setDraftDeleteReason('')
      return
    }

    setActionError(null)
    setEditingParticipationId(null)
    setIsEditingTotalAmount(false)
    setIsConfirmingClosedState(false)
    setIsAddingWorker(false)
    setDeletingParticipationId(participationId)
    setDraftDeleteReason('')
  }

  async function handleConfirmDeleteParticipation(participation: DailyParticipation) {
    try {
      await runAction(async () => {
        await deleteDailyParticipation(
          participation.id,
          dailyDetail?.is_closed ? draftDeleteReason.trim() : '',
        )
        await reloadAfterAction(() => {
          setDeletingParticipationId(null)
        })
      })
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        handleUnauthorized()
        return
      }

      setActionError(
        actionError instanceof Error
          ? actionError.message
          : 'No se pudo eliminar la participación.',
      )
    }
  }

  if (isLoading) {
    return (
      <section className="page">
        <header className="page-header-block">
          <div>
            <p className="eyebrow">Pantalla 2</p>
            <h2 className="page-title">Detalle del día {dailyTipId}</h2>
          </div>

          <Link className="btn ghost" to="/dashboard/weekly">
            Volver a semana
          </Link>
        </header>

        <section className="card">
          <p className="muted">Cargando detalle del día...</p>
        </section>
      </section>
    )
  }

  if (loadError) {
    return (
      <section className="page">
        <header className="page-header-block">
          <div>
            <p className="eyebrow">Pantalla 2</p>
            <h2 className="page-title">Detalle del día {dailyTipId}</h2>
          </div>

          <Link className="btn ghost" to="/dashboard/weekly">
            Volver a semana
          </Link>
        </header>

        <section className="card">
          <p className="muted">{loadError}</p>
        </section>
      </section>
    )
  }

  if (!dailyDetail) {
    return null
  }

  return (
    <section className="page">
      <DailyDetailHeader dailyDetail={dailyDetail} />

      {actionError ? (
        <section className="alert-banner" role="alert">
          <strong>Revisa la acción</strong>
          <p>{actionError}</p>
        </section>
      ) : null}

      <section className="detail-main-grid">
        <DailyDetailActionsPanel
          dailyDetail={dailyDetail}
          isSubmittingAction={isSubmittingAction}
          isEditingTotalAmount={isEditingTotalAmount}
          isConfirmingClosedState={isConfirmingClosedState}
          isAddingWorker={isAddingWorker}
          draftTotalAmount={draftTotalAmount}
          draftTotalAmountReason={draftTotalAmountReason}
          availableWorkers={availableWorkers}
          selectedWorkerId={selectedWorkerId}
          draftWorkerHours={draftWorkerHours}
          draftWorkerReason={draftWorkerReason}
          onOpenAddWorkerForm={handleOpenAddWorkerForm}
          onToggleEditTotalAmount={toggleEditTotalAmountPanel}
          onToggleClosedState={toggleClosedStatePanel}
          onSubmitTotalAmount={handleSubmitTotalAmount}
          onDraftTotalAmountChange={setDraftTotalAmount}
          onDraftTotalAmountReasonChange={setDraftTotalAmountReason}
          onCancelEditTotalAmount={() => {
            setDraftTotalAmount(dailyDetail.total_amount)
            setDraftTotalAmountReason('')
            setIsEditingTotalAmount(false)
            setActionError(null)
          }}
          onConfirmClosedState={handleConfirmClosedState}
          onCancelClosedState={() => {
            setIsConfirmingClosedState(false)
            setActionError(null)
          }}
          onSubmitAddWorker={handleSubmitAddWorker}
          onSelectedWorkerIdChange={setSelectedWorkerId}
          onDraftWorkerHoursChange={setDraftWorkerHours}
          onDraftWorkerReasonChange={setDraftWorkerReason}
          onCancelAddWorker={() => {
            setIsAddingWorker(false)
            setActionError(null)
          }}
        />

        <DailyWorkersTable
          workerRows={dailyDetail.worker_rows}
          isClosed={dailyDetail.is_closed}
          isSubmittingAction={isSubmittingAction}
          editingParticipationId={editingParticipationId}
          deletingParticipationId={deletingParticipationId}
          draftEditHours={draftEditHours}
          draftEditReason={draftEditReason}
          draftDeleteReason={draftDeleteReason}
          getParticipationByUserId={getParticipationByUserId}
          onStartEditHours={handleStartEditHours}
          onStartDeleteParticipation={handleStartDeleteParticipation}
          onSubmitEditHours={handleSubmitEditHours}
          onDraftEditHoursChange={setDraftEditHours}
          onDraftEditReasonChange={setDraftEditReason}
          onDraftDeleteReasonChange={setDraftDeleteReason}
          onConfirmDeleteParticipation={handleConfirmDeleteParticipation}
        />
      </section>

      <DailyHistoryList history={dailyDetail.history} />
    </section>
  )
}
