import { Link } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb'; // Asegúrate de tener un componente Breadcrumb
import LogoDark from '../../images/logo/logo-dark.svg';
import Logo from '../../images/logo/logo.svg';
const Unauthorized = () => {
  return (
    <>
      <Breadcrumb pageName="ERROR 401 | UNAUTHORIZED" />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-wrap items-center">
          <div className="hidden w-full xl:block xl:w-1/2">
            <div className="py-17.5 px-26 text-center">
              <Link className="mb-5.5 inline-block" to="/">
                <img className="hidden dark:block" src={Logo} alt="Logo" />
                <img className="dark:hidden" src={LogoDark} alt="Logo" />
              </Link>

              <p className="2xl:px-20 text-xl font-semibold text-gray-700 dark:text-gray-300">
                Acceso no autorizado
              </p>
              <p className="2xl:px-20 text-gray-600 dark:text-gray-400">
                Lo sentimos, no tienes permisos para acceder a esta página.
                Por favor, contacta con el administrador si necesitas ayuda.
              </p>

              <span className="mt-15 inline-block">
                <svg
                  width="350"
                  height="350"
                  viewBox="0 0 350 350"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* SVG con algún icono o ilustración */}
                  <path
                    d="M243.681 82.9153H241.762V30.3972C241.762 26.4054 240.975 22.4527 239.447 18.7647C237.918 15.0768 235.677 11.7258 232.853 8.90314C230.028 6.0805 226.674 3.84145 222.984 2.31385C219.293 0.786245 215.337 0 211.343 0H99.99C91.9222 0 84.1848 3.20256 78.48 8.90314C72.7752 14.6037 69.5703 22.3354 69.5703 30.3972V318.52C69.5703 322.512 70.3571 326.465 71.8859 330.153C73.4146 333.841 75.6553 337.192 78.48 340.015C81.3048 342.837 84.6582 345.076 88.3489 346.604C92.0396 348.131 95.9952 348.918 99.99 348.918H211.343C219.41 348.918 227.148 345.715 232.852 340.014C238.557 334.314 241.762 326.582 241.762 318.52V120.299H243.68L243.681 82.9153Z"
                    fill="#E6E6E6"
                  />
                </svg>
              </span>

              <Link to="/" className="mt-5 inline-block text-blue-500 hover:underline">
                Volver a la página principal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Unauthorized;
