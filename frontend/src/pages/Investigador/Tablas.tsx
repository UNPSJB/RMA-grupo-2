import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import TableOne from '../../components/Tables/TableOne';
import TableThree from '../../components/Tables/TableThree';
import TableTwo from '../../components/Tables/TableTwo';
import TableError from '../../components/Tables/TableError';


const Tablas = () => {
  return (
    <>
      <Breadcrumb pageName="Tablas" />

      <div className="flex flex-col gap-10">
        <TableOne />
        <TableTwo />
        <TableError />
        <TableThree />
      </div>
    </>
  );
};

export default Tablas;
