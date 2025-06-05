
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { User, Plus, Edit, Trash2, Mail, Phone, Book } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Teachers = () => {
  const { teachers, subjects, addTeacher, updateTeacher, deleteTeacher } = useData();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const teacherData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      subjects: editingTeacher?.subjects || []
    };

    if (editingTeacher) {
      updateTeacher(editingTeacher.id, teacherData);
      toast({
        title: "Professor atualizado",
        description: "O professor foi atualizado com sucesso",
      });
    } else {
      addTeacher(teacherData);
      toast({
        title: "Professor criado",
        description: "O professor foi criado com sucesso",
      });
    }

    setFormData({ name: '', email: '', phone: '' });
    setEditingTeacher(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (teacher: any) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteTeacher(id);
    toast({
      title: "Professor excluído",
      description: "O professor foi excluído com sucesso",
    });
  };

  const getTeacherSubjects = (teacherId: string) => {
    return subjects.filter(subject => subject.teacherId === teacherId);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Professores</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTeacher(null);
              setFormData({ name: '', email: '', phone: '' });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Professor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTeacher ? 'Editar Professor' : 'Novo Professor'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome Completo</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Prof. Ana Silva"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="professor@escola.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Telefone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingTeacher ? 'Atualizar' : 'Criar'} Professor
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teachers.map((teacher) => {
          const teacherSubjects = getTeacherSubjects(teacher.id);
          
          return (
            <Card key={teacher.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {teacher.name}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(teacher)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(teacher.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="truncate">{teacher.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{teacher.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Book className="h-4 w-4 text-gray-500" />
                    <span>
                      {teacherSubjects.length === 0 
                        ? 'Nenhuma disciplina'
                        : `${teacherSubjects.length} disciplina(s)`
                      }
                    </span>
                  </div>
                  {teacherSubjects.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 font-medium">Disciplinas:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {teacherSubjects.map((subject) => (
                          <span
                            key={subject.id}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                          >
                            {subject.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {teachers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum professor cadastrado ainda.</p>
        </div>
      )}
    </div>
  );
};

export default Teachers;
