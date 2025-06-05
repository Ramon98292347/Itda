
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Users, TrendingUp, BookOpen } from 'lucide-react';

const Reports = () => {
  const { students, teachers, subjects, classes, grades, attendances } = useData();
  const { user } = useAuth();

  // Dados para gráfico de alunos por turma
  const studentsPerClass = classes.map(cls => ({
    name: cls.name,
    alunos: students.filter(student => student.classId === cls.id).length
  }));

  // Dados para gráfico de notas por disciplina
  const gradesPerSubject = subjects.map(subject => {
    const subjectGrades = grades.filter(grade => grade.subjectId === subject.id);
    const averageGrade = subjectGrades.length > 0 
      ? subjectGrades.reduce((sum, grade) => sum + grade.value, 0) / subjectGrades.length 
      : 0;
    
    return {
      name: subject.name,
      media: Number(averageGrade.toFixed(1))
    };
  });

  // Dados para gráfico de presença
  const attendanceData = subjects.map(subject => {
    const subjectAttendances = attendances.filter(att => att.subjectId === subject.id);
    const presentCount = subjectAttendances.filter(att => att.present).length;
    const totalCount = subjectAttendances.length;
    const percentage = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;
    
    return {
      name: subject.name,
      presenca: Number(percentage.toFixed(1))
    };
  });

  // Cores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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
        <h1 className="text-3xl font-bold text-gray-900">Relatórios e Estatísticas</h1>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              Distribuídos em {classes.length} turmas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Professores</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
            <p className="text-xs text-muted-foreground">
              Lecionando {subjects.length} disciplinas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notas Lançadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grades.length}</div>
            <p className="text-xs text-muted-foreground">
              Registros de avaliação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presenças</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendances.length}</div>
            <p className="text-xs text-muted-foreground">
              Registros de presença
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Alunos por Turma</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentsPerClass}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="alunos" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Média de Notas por Disciplina</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradesPerSubject}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="media" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taxa de Presença por Disciplina (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="presenca" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Disciplinas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subjects.map((subject, index) => ({
                    name: subject.name,
                    value: subject.workload,
                    fill: COLORS[index % COLORS.length]
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subjects.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas adicionais */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total de Turmas:</span>
                <span className="font-medium">{classes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Média de Alunos/Turma:</span>
                <span className="font-medium">
                  {classes.length > 0 ? Math.round(students.length / classes.length) : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Disciplinas/Professor:</span>
                <span className="font-medium">
                  {teachers.length > 0 ? Math.round(subjects.length / teachers.length) : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desempenho Acadêmico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Notas Registradas:</span>
                <span className="font-medium">{grades.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Média Geral:</span>
                <span className="font-medium">
                  {grades.length > 0 
                    ? (grades.reduce((sum, grade) => sum + grade.value, 0) / grades.length).toFixed(1)
                    : '0.0'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Taxa de Presença:</span>
                <span className="font-medium">
                  {attendances.length > 0 
                    ? `${((attendances.filter(att => att.present).length / attendances.length) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carga Horária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total de Horas/Ano:</span>
                <span className="font-medium">
                  {subjects.reduce((sum, subject) => sum + subject.workload, 0)}h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Média por Disciplina:</span>
                <span className="font-medium">
                  {subjects.length > 0 
                    ? Math.round(subjects.reduce((sum, subject) => sum + subject.workload, 0) / subjects.length)
                    : 0
                  }h
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
