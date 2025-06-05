
import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import StatsCard from '@/components/dashboard/StatsCard';
import { Users, User, Book, Calendar, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const { students, teachers, subjects, classes, grades } = useData();
  const { user } = useAuth();
  const [expandedGradeCard, setExpandedGradeCard] = useState<string | null>(null);

  const studentDetails = [
    { label: 'Total cadastrados', value: students.length },
    { label: 'Ativos', value: students.length },
    { label: 'Por turma', value: `${Math.ceil(students.length / classes.length)} alunos/turma` }
  ];

  const teacherDetails = [
    { label: 'Total cadastrados', value: teachers.length },
    { label: 'Ativos', value: teachers.length },
    { label: 'Disciplinas por professor', value: `${Math.ceil(subjects.length / teachers.length)} disciplinas` }
  ];

  const subjectDetails = [
    { label: 'Total oferecidas', value: subjects.length },
    { label: 'Ativas', value: subjects.length },
    { label: 'Carga horária média', value: `${subjects.reduce((acc, s) => acc + s.workload, 0) / subjects.length}h` }
  ];

  const classDetails = [
    { label: 'Total ativas', value: classes.length },
    { label: 'Alunos por turma', value: `${Math.ceil(students.length / classes.length)} alunos` },
    { label: 'Períodos', value: 'Manhã, Tarde' }
  ];

  const gradeDetails = [
    { label: 'Total lançadas', value: grades.length },
    { label: 'Média geral', value: grades.length > 0 ? `${(grades.reduce((acc, g) => acc + g.value, 0) / grades.length).toFixed(1)}` : '0' },
    { label: 'Aprovados', value: `${grades.filter(g => g.value >= 5.0).length}` }
  ];

  // Agrupar notas por disciplina e bimestre
  const groupedGrades = grades.reduce((acc, grade) => {
    const key = `${grade.subjectId}-${grade.quarter}`;
    if (!acc[key]) {
      acc[key] = {
        subjectId: grade.subjectId,
        quarter: grade.quarter,
        grades: []
      };
    }
    acc[key].grades.push(grade);
    return acc;
  }, {} as Record<string, { subjectId: string; quarter: number; grades: any[] }>);

  const getApprovalStatus = (grade: number) => {
    return grade >= 5.0 ? 'Aprovado' : 'Reprovado';
  };

  const getApprovalColor = (grade: number) => {
    return grade >= 5.0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white';
  };

  const toggleGradeCardExpansion = (cardKey: string) => {
    setExpandedGradeCard(expandedGradeCard === cardKey ? null : cardKey);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {user?.role === 'admin' ? 'Dashboard Administrativo' : 'Dashboard do Professor'}
        </h1>
        <p className="text-gray-600">Bem-vindo, {user?.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total de Alunos"
          value={students.length}
          description="Alunos cadastrados"
          icon={Users}
          color="bg-blue-500"
          details={studentDetails}
        />
        
        <StatsCard
          title="Professores"
          value={teachers.length}
          description="Professores ativos"
          icon={User}
          color="bg-green-500"
          details={teacherDetails}
        />
        
        <StatsCard
          title="Disciplinas"
          value={subjects.length}
          description="Disciplinas oferecidas"
          icon={Book}
          color="bg-purple-500"
          details={subjectDetails}
        />
        
        <StatsCard
          title="Turmas"
          value={classes.length}
          description="Turmas ativas"
          icon={Calendar}
          color="bg-orange-500"
          details={classDetails}
        />

        <StatsCard
          title="Notas"
          value={grades.length}
          description="Notas registradas"
          icon={BookOpen}
          color="bg-indigo-500"
          details={gradeDetails}
        />
      </div>

      {/* Cards de Notas Registradas */}
      {grades.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Notas Registradas Recentes</h2>
          <div className="grid gap-4">
            {Object.values(groupedGrades).slice(0, 3).map((group) => {
              const subject = subjects.find(s => s.id === group.subjectId);
              
              // Filtrar apenas notas do professor logado se for professor
              if (user?.role === 'professor' && subject?.teacherId !== user?.id) return null;

              const studentsInGroup = group.grades.map(g => students.find(s => s.id === g.studentId)).filter(Boolean);
              const classData = studentsInGroup.length > 0 ? classes.find(c => c.id === studentsInGroup[0]?.classId) : null;
              const averageGrade = group.grades.reduce((sum, grade) => sum + grade.value, 0) / group.grades.length;
              const cardKey = `${group.subjectId}-${group.quarter}`;
              const isExpanded = expandedGradeCard === cardKey;

              return (
                <Card key={cardKey} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3" onClick={() => toggleGradeCardExpansion(cardKey)}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          {subject?.name}
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          {classData?.name} • {group.quarter}º Bimestre
                        </p>
                        <p className="text-sm text-gray-600">
                          Alunos: {group.grades.length} • Média: {averageGrade.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700 mb-3">Notas dos Alunos:</h4>
                        {group.grades.map((grade: any) => {
                          const student = students.find(s => s.id === grade.studentId);
                          const status = getApprovalStatus(grade.value);
                          const statusColor = getApprovalColor(grade.value);
                          
                          return (
                            <div key={grade.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{student?.name}</p>
                                <p className="text-sm text-gray-500">Matrícula: {student?.registration}</p>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <div>
                                  <p className="text-lg font-bold text-blue-600">{grade.value.toFixed(1)}</p>
                                  <p className="text-xs text-gray-500">Nota</p>
                                </div>
                                <Badge className={statusColor}>
                                  {status}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Atividades Recentes</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">Novo aluno cadastrado</span>
              <span className="text-xs text-gray-500">Hoje</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">Disciplina atualizada</span>
              <span className="text-xs text-gray-500">Ontem</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Nova turma criada</span>
              <span className="text-xs text-gray-500">2 dias atrás</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Avisos Importantes</h3>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400">
              <p className="text-sm text-yellow-800">
                Reunião pedagógica agendada para sexta-feira
              </p>
            </div>
            <div className="p-3 bg-blue-50 border-l-4 border-blue-400">
              <p className="text-sm text-blue-800">
                Período de matrícula aberto até o final do mês
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
