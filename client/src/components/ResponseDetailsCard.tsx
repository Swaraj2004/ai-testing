import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

const ResponseDetailsCard = ({
  inputTokens,
  outputTokens,
  fetchDuration,
}: {
  inputTokens: string | null;
  outputTokens: string | null;
  fetchDuration: number | null;
}) => {
  return (
    <Card className="mt-5">
      <CardContent className="pt-6">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Input Tokens</TableCell>
              <TableCell>{inputTokens || "-"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Output Tokens</TableCell>
              <TableCell>{outputTokens || "-"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Fetch Duration</TableCell>
              <TableCell>
                {fetchDuration ? `${fetchDuration} secs` : "-"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ResponseDetailsCard;
