import { Routes,Route } from 'react-router-dom'
import { Empleados } from './components/Empleados'
import './App.css'

function App() {
 

  return (
    <>
    <Routes>
      <Route path='/' element={<Empleados/>}></Route>
    </Routes>
    </>
  )
}

export default App
