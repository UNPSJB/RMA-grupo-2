


const temperatureData = [
  {
    node: 'Nodo 1',
    date: '2024-10-01',
    temperature: 22,
    humidity: 45,
    status: 'OK'
  },
  {
    node: 'Nodo 2',
    date: '2024-10-01',
    temperature: 25,
    humidity: 50,
    status: 'OK'
  },
  {
    node: 'Nodo 3',
    date: '2024-10-01',
    temperature: 21,
    humidity: 55,
    status: 'Alerta'
  },
  {
    node: 'Nodo 4',
    date: '2024-10-02',
    temperature: 24,
    humidity: 48,
    status: 'OK'
  },
  {
    node: 'Nodo 5',
    date: '2024-10-02',
    temperature: 19,
    humidity: 60,
    status: 'Alerta'
  }
];
const TableOne= () => {
  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Temperaturas por Nodos
      </h4>

      <div className="flex flex-col">
        <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-5">
          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Nodo
            </h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Fecha
            </h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Temperatura (°C)
            </h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Humedad (%)
            </h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Estado
            </h5>
          </div>
        </div>

        {temperatureData.map((data, key) => (
          <div
            className={`grid grid-cols-3 sm:grid-cols-5 ${
              key === temperatureData.length - 1
                ? ''
                : 'border-b border-stroke dark:border-strokedark'
            }`}
            key={key}
          >
            <div className="flex items-center gap-3 p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{data.node}</p>
            </div>

            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{data.date}</p>
            </div>

            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-meta-3">{data.temperature}°C</p>
            </div>

            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-black dark:text-white">{data.humidity}%</p>
            </div>

            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className={`text-${data.status === 'OK' ? 'green' : 'red'}`}>{data.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export default TableOne;
