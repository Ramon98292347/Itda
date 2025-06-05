import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Users, Edit, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const Grades = () => {
  const { classes, students, subjects, addGrade, grades, updateGrade, deleteGrade } = useData();
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [gradeData, setGradeData] = useState<Record<string, number>>({});
  const [editingGrades, setEditingGrades] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Filtrar disciplinas do professor logado
  const teacherSubjects = subjects.filter(subject => subject.teacherId === user?.id);
  
  // Obter alunos da turma selecionada
  const classStudents = selectedClass ? 
    students.filter(student => student.classId === selectedClass) : [];

  // Agrupar notas por disciplina, turma e bimestre
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

  const handleGradeChange = (studentId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
      setGradeData(prev => ({
        ...prev,
        [studentId]: numValue
      }));
    } else if (value === '') {
      setGradeData(prev => {
        const newData = { ...prev };
        delete newData[studentId];
        return newData;
      });
    }
  };

  const handleSaveGrades = () => {
    if (!selectedClass || !selectedSubject || !selectedQuarter) {
      toast({
        title: "Erro",
        description: "Selecione turma, disciplina e bimestre",
        variant: "destructive",
      });
      return;
    }

    Object.entries(gradeData).forEach(([studentId, value]) => {
      const existingGrade = grades.find(g => 
        g.studentId === studentId && 
        g.subjectId === selectedSubject && 
        g.quarter === parseInt(selectedQuarter)
      );

      if (existingGrade && updateGrade) {
        updateGrade(existingGrade.id, { value });
      } else {
        addGrade({
          studentId,
          subjectId: selectedSubject,
          quarter: parseInt(selectedQuarter),
          value
        });
      }
    });

    toast({
      title: "Notas salvas",
      description: "As notas foram registradas com sucesso",
    });

    setGradeData({});
    setEditingGrades(null);
  };

  const handleEditGrades = (gradeGroup: any) => {
    setSelectedSubject(gradeGroup.subjectId);
    setSelectedQuarter(gradeGroup.quarter.toString());
    
    const data: Record<string, number> = {};
    gradeGroup.grades.forEach((grade: any) => {
      data[grade.studentId] = grade.value;
      const student = students.find(s => s.id === grade.studentId);
      if (student) {
        setSelectedClass(student.classId);
      }
    });
    setGradeData(data);
    setEditingGrades(`${gradeGroup.subjectId}-${gradeGroup.quarter}`);
  };

  const handleDeleteGrades = (gradeGroup: any) => {
    if (deleteGrade) {
      gradeGroup.grades.forEach((grade: any) => {
        deleteGrade(grade.id);
      });

      toast({
        title: "Notas excluídas",
        description: "As notas foram excluídas com sucesso",
      });
    }
  };

  const handleExportGrades = (gradeGroup: any) => {
    const subject = subjects.find(s => s.id === gradeGroup.subjectId);
    
    const csvContent = [
      ['Disciplina', 'Bimestre', 'Aluno', 'Matrícula', 'Nota'],
      ...gradeGroup.grades.map((grade: any) => {
        const student = students.find(s => s.id === grade.studentId);
        return [
          subject?.name || '',
          gradeGroup.quarter.toString(),
          student?.name || '',
          student?.registration || '',
          grade.value.toString()
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notas_${gradeGroup.quarter}bim_${subject?.name}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: "Arquivo CSV baixado com sucesso",
    });
  };

  const getExistingGrade = (studentId: string) => {
    return grades.find(grade => 
      grade.studentId === studentId && 
      grade.subjectId === selectedSubject && 
      grade.quarter === parseInt(selectedQuarter)
    );
  };

  const toggleCardExpansion = (cardKey: string) => {
    setExpandedCard(expandedCard === cardKey ? null : cardKey);
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
        <h1 className="text-3xl font-bold text-gray-900">Lançamento de Notas</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div>
          <label className="block text-sm font-medium mb-2">Disciplina</label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a disciplina" />
            </SelectTrigger>
            <SelectContent>
              {teacherSubjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Turma</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a turma" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Bimestre</label>
          <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o bimestre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1º Bimestre</SelectItem>
              <SelectItem value="2">2º Bimestre</SelectItem>
              <SelectItem value="3">3º Bimestre</SelectItem>
              <SelectItem value="4">4º Bimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 flex items-end">
          <Button 
            onClick={handleSaveGrades}
            disabled={!selectedClass || !selectedSubject || !selectedQuarter || Object.keys(gradeData).length === 0}
            className="w-full"
          >
            {editingGrades ? 'Atualizar Notas' : 'Salvar Notas'}
          </Button>
        </div>
      </div>

      {selectedClass && selectedSubject && selectedQuarter && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Notas - {classes.find(c => c.id === selectedClass)?.name} - {selectedQuarter}º Bimestre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {classStudents.map((student) => {
                const existingGrade = getExistingGrade(student.id);
                const currentGrade = gradeData[student.id];
                const displayValue = currentGrade !== undefined ? currentGrade : existingGrade?.value || '';

                return (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.registration}</p>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="0.0"
                        value={displayValue}
                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                        className="text-center"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClass && selectedSubject && selectedQuarter && classStudents.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum aluno encontrado nesta turma.</p>
        </div>
      )}

      {/* Lista de notas registradas */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Notas Registradas</h2>
        {Object.values(groupedGrades).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Nenhuma nota registrada ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {Object.values(groupedGrades).map((group) => {
              const subject = subjects.find(s => s.id === group.subjectId);
              
              // Filtrar apenas notas do professor logado
              if (subject?.teacherId !== user?.id) return null;

              const studentsInGroup = group.grades.map(g => students.find(s => s.id === g.studentId)).filter(Boolean);
              const classData = studentsInGroup.length > 0 ? classes.find(c => c.id === studentsInGroup[0]?.classId) : null;
              const averageGrade = group.grades.reduce((sum, grade) => sum + grade.value, 0) / group.grades.length;
              const cardKey = `${group.subjectId}-${group.quarter}`;
              const isExpanded = expandedCard === cardKey;

              return (
                <Card key={cardKey} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3" onClick={() => toggleCardExpansion(cardKey)}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
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
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditGrades(group)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportGrades(group)}
                          className="flex items-center gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          Exportar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteGrades(group)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
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
        )}
      </div>

      {teacherSubjects.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhuma disciplina encontrada.</p>
        </div>
      )}
    </div>
  );
};

export default Grades;
