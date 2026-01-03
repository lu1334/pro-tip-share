import React, { useEffect, useState } from "react";
import type { Empleado } from "../types/types";

export function Empleados() {
  // Datos que escribo en los inputs
  const [nombre, setNombre] = useState<string>("");
  const [horas, setHoras] = useState<number>(0);

  // Lista de empleados guardada en localStorage
  const [listaEmpleados, setListaEmpleados] = useState<Empleado[]>(() => {
    const res = localStorage.getItem("listaEmpleados");
    return res ? JSON.parse(res) : [];
  });

  // Monto que escribo en el input del bote (no es el guardado)
  const [bote, setBote] = useState<number>(0);

  // Bote acumulado que sí guardo en localStorage
  const [boteGuardado, setBoteGuardado] = useState<number | null>(() => {
    const res = localStorage.getItem("boteGuardado");
    return res ? JSON.parse(res) : null;
  });

  // Cada vez que cambia el bote guardado, lo guardo en localStorage
  useEffect(() => {
    localStorage.setItem("boteGuardado", JSON.stringify(boteGuardado));
  }, [boteGuardado]);

  // Cada vez que cambia la lista de empleados, la guardo en localStorage
  useEffect(() => {
    localStorage.setItem("listaEmpleados", JSON.stringify(listaEmpleados));
  }, [listaEmpleados]);

  // Muevo el texto del input a número, cuidando NaN
  const handlerOnchangeBote = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = Number(e.target.value);
    setBote(Number.isNaN(numValue) ? 0 : numValue);
  };

  // Sumamos el monto escrito al bote guardado y recalculamos las propinas
const handlerAgregarBote = () => {
  if (bote <= 0) return;
  const nuevoBote = (boteGuardado || 0) + bote; // Sumamos el nuevo monto
  setBoteGuardado(nuevoBote);

    // Recalculamos a todos con el nuevo total
    setListaEmpleados((prev) => {
      const totalHoras = prev.reduce((acc, emp) => acc + emp.horas, 0);
      if (totalHoras === 0) return prev;

      const precioHora = nuevoBote / totalHoras;
      return prev.map((emp) => ({
        ...emp,
        cantidad: emp.horas * precioHora,
      }));
    });

    setBote(0); // Limpiamos el input del bote
  };
  const handlerOnchangeNombre = (e: React.ChangeEvent<HTMLInputElement>) =>
    setNombre(e.target.value);
  const handlerOnchangeHoras = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = Number(e.target.value);
    setHoras(Number.isNaN(numValue) ? 0 : numValue);
  };

  // Crear un empleado nuevo y recalcular lo que le toca a cada uno
  const agregarEmpleado = () => {
    if (!nombre.trim()) return;
    if (horas <= 0) return;

    setListaEmpleados((prev) => {
      const nuevaLista: Empleado[] = [
        ...prev,
        { id: Date.now(), nombre: nombre.trim(), horas, cantidad: 0 },
      ];

      const totalHoras = nuevaLista.reduce((acc, emp) => acc + emp.horas, 0);
      if (totalHoras === 0) return nuevaLista;

      const precioHora = (boteGuardado || 0) / totalHoras;

      return nuevaLista.map((emp) => ({
        ...emp,
        cantidad: emp.horas * precioHora,
      }));
    });

    // limpiar inputs
    setNombre("");
    setHoras(0);
  };

  const handlerEliminarBote = () => {
    setBoteGuardado(null);
    localStorage.removeItem("boteGuardado");
  };

  const handlerEliminarEmpleado = (id: number) => {
    setListaEmpleados((prev) => prev.filter((emp) => emp.id !== id));
  };
  const prepararEdicion = (emp: Empleado) => {
    setNombre(emp.nombre);
    setHoras(emp.horas);

    handlerEliminarEmpleado(emp.id);
  };

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Control de propinas</p>
          <h1>Reparte el bote con claridad</h1>
          <p className="muted">
            Añade el monto total, registra horas y reparte sin complicaciones.
          </p>
        </div>
      </header>

      <div className="card-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Bote</p>
              <h2>Actualizar total</h2>
              <p className="muted">
                Suma el monto que se ha generado antes de repartirlo.
              </p>
            </div>
          </div>

          <div className="stack gap-md">
            <div className="field">
              <label className="label">Cantidad a añadir</label>
              <div className="inline-input">
                <input
                  className="input"
                  type="number"
                  value={bote}
                  onChange={handlerOnchangeBote}
                  placeholder="0.00"
                />
                <button className="btn primary" onClick={handlerAgregarBote}>
                  Agregar cantidad
                </button>
              </div>
            </div>

            {boteGuardado !== null && (
              <div className="saved-bote">
                <div>
                  <p className="eyebrow">Bote acumulado</p>
                  <p className="amount">€ {boteGuardado.toFixed(2)}</p>
                </div>
                <button
                  className="btn ghost danger"
                  onClick={handlerEliminarBote}
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Equipo</p>
              <h2>Añadir empleado</h2>
              <p className="muted">
                Registra el nombre y las horas trabajadas para repartir.
              </p>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label className="label">Nombre</label>
              <input
                className="input"
                value={nombre}
                onChange={handlerOnchangeNombre}
                placeholder="Ej. María"
              />
            </div>
            <div className="field">
              <label className="label">Horas</label>
              <input
                className="input"
                value={horas}
                onChange={handlerOnchangeHoras}
                placeholder="0"
                type="number"
              />
            </div>
          </div>
          <button className="btn primary full" onClick={agregarEmpleado}>
            Agregar empleado
          </button>
        </section>
      </div>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Distribución</p>
            <h2>Empleados</h2>
          </div>
          <p className="muted small">
            {listaEmpleados.length}{" "}
            {listaEmpleados.length === 1 ? "persona" : "personas"}
          </p>
        </div>

        {listaEmpleados.length === 0 ? (
          <div className="empty-state">
            <p className="eyebrow">Sin registros aún</p>
            <p className="muted">
              Añade colaboradores para calcular cuánto le corresponde a cada
              uno.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Horas</th>
                  <th>Propina</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {listaEmpleados.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.nombre}</td>
                    <td>{emp.horas} h</td>
                    <td>€ {emp.cantidad.toFixed(2)}</td>
                    <td className="actions">
                      <button
                        className="btn ghost"
                        onClick={() => prepararEdicion(emp)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn text danger"
                        onClick={() => handlerEliminarEmpleado(emp.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
