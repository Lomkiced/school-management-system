import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import api from '../../lib/axios';

interface SchoolClass {
  id: number;
  teacher: { lastName: string; firstName: string };
  subject: { name: string; code: string };
  section: { name: string };
}

export const ClassList = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get('/classes');
        setClasses(response.data.data);
      } catch (error) {
        console.error("Failed to fetch classes", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Academic Classes</h1>
        <Button className="flex items-center gap-2" onClick={() => navigate('/classes/new')}>
          <Plus size={16} /> Assign Class
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Code</TableHead>
                <TableHead>Subject Name</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Assigned Teacher</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
              ) : classes.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center">No classes scheduled yet.</TableCell></TableRow>
              ) : (
                classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.subject.code}</TableCell>
                    <TableCell>{cls.subject.name}</TableCell>
                    <TableCell>{cls.section.name}</TableCell>
                    <TableCell>{cls.teacher.lastName}, {cls.teacher.firstName}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="secondary" size="sm"
                        onClick={() => navigate(`/classes/${cls.id}/grading`)}>
                        Open Gradebook
                    </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};