import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import TableOne from '../../components/Tables/TableOne';
import TableThree from '../../components/Tables/TableThree';
import TableTwo from '../../components/Tables/TableTwo';
import TableError from '../../components/Tables/TableError';
import TableSensores from '../../components/Tables/TableSensores';

const Tablas = () => {
  return (
    <>
      <Breadcrumb pageName="Tablas" />

      <div className="flex flex-col gap-10">
        <TableOne />
        <TableTwo />
        <TableThree />
        <TableError />
        <TableSensores />
      </div>
    </>
  );
};

export default Tablas;
