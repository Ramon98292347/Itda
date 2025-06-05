
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Book, Clock, Calendar } from 'lucide-react';

const MyClasses = () => {
  const { classes, students, subjects } = useData();
  const { user } = useAuth();

  // Filtrar disciplinas do professor logado
  const teacherSubjects = subjects.filter(subject => subject.teacherId === user?.id);
  
  // Obter turmas relacionadas às disciplinas do professor
  const teacherClasses = classes.filter(cls => 
    cls.studentIds.some(studentId => 
      students.some(student => student.id === studentId)
    )
  );

  const getClassStudents = (classId: string) => {
    return students.filter(student => student.classId === classId);
  };

  const getSubjectsForClass = (classId: string) => {
    return teacherSubjects; // Por simplicidade, assumindo que o professor leciona todas suas disciplinas em todas as turmas
  };

  if (user?.role !== 'professor') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Acesso restrito a professores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Minhas Turmas</h1>
      </div>

      {/* Resumo das disciplinas do professor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Minhas Disciplinas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {teacherSubjects.map((subject) => (
              <div key={subject.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">{subject.name}</p>
                  <p className="text-sm text-gray-600">{subject.workload}h/ano</p>
                </div>
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            ))}
          </div>
          {teacherSubjects.length === 0 && (
            <p className="text-gray-500">Nenhuma disciplina encontrada.</p>
          )}
        </CardContent>
      </Card>

      {/* Lista de turmas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teacherClasses.map((classItem) => {
          const classStudents = getClassStudents(classItem.id);
          const classSubjects = getSubjectsForClass(classItem.id);
          
          return (
            <Card key={classItem.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {classItem.name}
                </CardTitle>
                <p className="text-sm text-gray-600">{classItem.year}º Ano • {classItem.period}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total de Alunos:</span>
                    <span className="font-medium">{classStudents.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Disciplinas que leciono:</span>
                    <span className="font-medium">{classSubjects.length}</span>
                  </div>

                  {classSubjects.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-2">Disciplinas:</p>
                      <div className="flex flex-wrap gap-1">
                        {classSubjects.map((subject) => (
                          <span
                            key={subject.id}
                            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                          >
                            {subject.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {classStudents.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-2">Alguns alunos:</p>
                      <div className="space-y-1">
                        {classStudents.slice(0, 3).map((student) => (
                          <div key={student.id} className="text-xs flex justify-between">
                            <span className="truncate">{student.name}</span>
                            <span className="text-gray-500">{student.registration}</span>
                          </div>
                        ))}
                        {classStudents.length > 3 && (
                          <p className="text-xs text-gray-500">
                            ... e mais {classStudents.length - 3} alunos
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {teacherClasses.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma turma encontrada.</p>
          <p className="text-sm text-gray-400 mt-2">
            As turmas aparecerão aqui quando houver alunos matriculados e disciplinas atribuídas.
          </p>
        </div>
      )}

      {teacherSubjects.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma disciplina atribuída.</p>
            <p className="text-sm text-gray-400 mt-2">
              Entre em contato com a administração para ter disciplinas atribuídas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyClasses;
