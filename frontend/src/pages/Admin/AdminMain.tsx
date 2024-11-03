import React, { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import LogoDark from '../../images/logo/logo-dark.svg';
import Logo from '../../images/logo/logo.svg';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
//import { ReactComponent as nodo } from '../../images/logos/nodo.svg';
//import { ReactComponent as persona } from '../../images/logos/persona.svg';


const AdminMain: React.FC = () => {

return (
    
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
    <div className="flex flex-wrap items-center">


      <div className="w-full border-stroke dark:border-strokedark xl:w-1/2 xl:border-l-2">
        <div className="w-full p-4 sm:p-12.5 xl:p-17.5">
        
          <h2 className="mb-9 text-2xl font-bold text-black dark:text-white sm:text-title-xl2">
            Bienvenido Admin
          </h2>
          <div className="mb-5">
            <div
                className="w-full cursor-pointer rounded-lg border border-primary bg-primary py-6 px-4 p-4 text-white transition hover:bg-opacity-90"
            >
                <Link to="/admin/nodos" className="text-white text-xl">
                    Administrar nodos
                </Link>
            </div>
        </div>
        <div className="mb-5">
            <div
                className="w-full cursor-pointer rounded-lg border border-primary bg-primary py-6 px-4 p-4 text-white transition hover:bg-opacity-90"
            >
                <Link to="/admin/usuarios" className="text-white text-xl">
                    Administrar usuarios
                </Link>
            </div>
        </div>
        </div>
      </div>
    </div>
  </div>
);
}

export default AdminMain;