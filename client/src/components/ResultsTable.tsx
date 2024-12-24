import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RowTable } from "@/types/airesponse";

interface ResultsTableProps {
  data: RowTable[] | null;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ data }) => {
  return (
    <Table className="mb-6">
      <TableHeader>
        <TableRow>
          <TableCell>Sr No.</TableCell>
          <TableCell>Test</TableCell>
          <TableCell>Observation</TableCell>
          <TableCell>Unit</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((row, index) => (
          <TableRow key={index}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>{row.test}</TableCell>
            <TableCell>{row.observation}</TableCell>
            <TableCell>{row.unit}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ResultsTable;
