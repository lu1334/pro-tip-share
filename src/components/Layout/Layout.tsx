import { Link } from "react-router-dom";

export function Layout(){
    return(
        <>
        <ul>
            <li><Link to="empleados">Empleados</Link></li>
        </ul>
        </>
    )
}