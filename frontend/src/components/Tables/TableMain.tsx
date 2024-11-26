import { Link } from "react-router-dom";

const HistorialMain: React.FC = () => {

    return (
        
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-wrap items-center">
    
    
          <div className="w-full border-stroke dark:border-strokedark xl:w-1/2 xl:border-l-2">
            <div className="w-full p-4 sm:p-12.5 xl:p-17.5">
            
              <h2 className="mb-9 text-2xl font-bold text-black dark:text-white sm:text-title-xl2">
                Menu de Historial
              </h2>
              <div className="mb-5">
                <div
                    className="w-full cursor-pointer rounded-lg border border-primary bg-primary py-6 px-4 p-4 text-white transition hover:bg-opacity-90"
                >
                    <Link to="/admin/historial" className="text-white text-xl">
                        Historial de mediciones
                    </Link>
                </div>
            </div>
            <div className="mb-5">
                <div
                    className="w-full cursor-pointer rounded-lg border border-primary bg-primary py-6 px-4 p-4 text-white transition hover:bg-opacity-90"
                >
                    <Link to="/admin/historialerrores" className="text-white text-xl">
                        Historial de errores
                    </Link>
                </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    );
    }
    
    export default HistorialMain;