import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Users, Edit, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';

const Attendance = () => {
  const { classes, students, subjects, addAttendance, attendances, updateAttendance, deleteAttendance } = useData();
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<string, boolean>>({});
  const [editingAttendance, setEditingAttendance] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Filtrar disciplinas do professor logado
  const teacherSubjects = subjects.filter(subject => subject.teacherId === user?.id);
  
  // Obter alunos da turma selecionada
  const classStudents = selectedClass ? 
    students.filter(student => student.classId === selectedClass) : [];

  // Agrupar presenças por data e disciplina
  const groupedAttendances = attendances.reduce((acc, attendance) => {
    const key = `${attendance.date}-${attendance.subjectId}-${attendance.classId}`;
    if (!acc[key]) {
      acc[key] = {
        date: attendance.date,
        subjectId: attendance.subjectId,
        classId: attendance.classId,
        attendances: []
      };
    }
    acc[key].attendances.push(attendance);
    return acc;
  }, {} as Record<string, { date: string; subjectId: string; classId: string; attendances: any[] }>);

  const handleAttendanceChange = (studentId: string, present: boolean) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: present
    }));
  };

  const handleSaveAttendance = () => {
    if (!selectedClass || !selectedSubject || !selectedDate) {
      toast({
        title: "Erro",
        description: "Selecione turma, disciplina e data",
        variant: "destructive",
      });
      return;
    }

    Object.entries(attendanceData).forEach(([studentId, present]) => {
      const existingAttendance = attendances.find(att => 
        att.studentId === studentId && 
        att.subjectId === selectedSubject && 
        att.date === selectedDate &&
        att.classId === selectedClass
      );

      if (existingAttendance && updateAttendance) {
        updateAttendance(existingAttendance.id, { present });
      } else {
        addAttendance({
          studentId,
          subjectId: selectedSubject,
          classId: selectedClass,
          date: selectedDate,
          present
        });
      }
    });

    toast({
      title: "Presença salva",
      description: "A presença foi registrada com sucesso",
    });

    setAttendanceData({});
    setEditingAttendance(null);
  };

  const handleEditAttendance = (attendanceGroup: any) => {
    setSelectedSubject(attendanceGroup.subjectId);
    setSelectedClass(attendanceGroup.classId);
    setSelectedDate(attendanceGroup.date);
    
    const data: Record<string, boolean> = {};
    attendanceGroup.attendances.forEach((attendance: any) => {
      data[attendance.studentId] = attendance.present;
    });
    setAttendanceData(data);
    setEditingAttendance(`${attendanceGroup.date}-${attendanceGroup.subjectId}-${attendanceGroup.classId}`);
  };

  const handleDeleteAttendance = (attendanceGroup: any) => {
    if (deleteAttendance) {
      attendanceGroup.attendances.forEach((attendance: any) => {
        deleteAttendance(attendance.id);
      });

      toast({
        title: "Presença excluída",
        description: "A presença foi excluída com sucesso",
      });
    }
  };

  const handleExportAttendance = (attendanceGroup: any) => {
    const subject = subjects.find(s => s.id === attendanceGroup.subjectId);
    const classData = classes.find(c => c.id === attendanceGroup.classId);
    
    const csvContent = [
      ['Data', 'Disciplina', 'Turma', 'Aluno', 'Matrícula', 'Presente'],
      ...attendanceGroup.attendances.map((attendance: any) => {
        const student = students.find(s => s.id === attendance.studentId);
        return [
          attendanceGroup.date,
          subject?.name || '',
          classData?.name || '',
          student?.name || '',
          student?.registration || '',
          attendance.present ? 'Sim' : 'Não'
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presenca_${attendanceGroup.date}_${subject?.name}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: "Arquivo CSV baixado com sucesso",
    });
  };

  const getExistingAttendance = (studentId: string) => {
    return attendances.find(attendance => 
      attendance.studentId === studentId && 
      attendance.subjectId === selectedSubject && 
      attendance.date === selectedDate &&
      attendance.classId === selectedClass
    );
  };

  const toggleCardExpansion = (cardKey: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardKey)) {
      newExpanded.delete(cardKey);
    } else {
      newExpanded.add(cardKey);
    }
    setExpandedCards(newExpanded);
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
        <h1 className="text-3xl font-bold text-gray-900">Registro de Presença</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
          <label className="block text-sm font-medium mb-2">Data</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <Button 
            onClick={handleSaveAttendance}
            disabled={!selectedClass || !selectedSubject || !selectedDate || Object.keys(attendanceData).length === 0}
            className="w-full"
          >
            {editingAttendance ? 'Atualizar' : 'Salvar'} Presença
          </Button>
        </div>
      </div>

      {selectedClass && selectedSubject && selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Presença - {classes.find(c => c.id === selectedClass)?.name} - {new Date(selectedDate).toLocaleDateString('pt-BR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {classStudents.map((student) => {
                const existingAttendance = getExistingAttendance(student.id);
                const currentAttendance = attendanceData[student.id];
                const attendanceValue = currentAttendance !== undefined ? 
                  (currentAttendance ? 'presente' : 'faltou') : 
                  (existingAttendance?.present ? 'presente' : existingAttendance?.present === false ? 'faltou' : '');

                return (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-lg">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.registration}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <RadioGroup 
                        value={attendanceValue}
                        onValueChange={(value) => 
                          handleAttendanceChange(student.id, value === 'presente')
                        }
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="presente" id={`presente-${student.id}`} />
                          <label 
                            htmlFor={`presente-${student.id}`} 
                            className="text-sm font-medium cursor-pointer text-green-600"
                          >
                            Presente
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="faltou" id={`faltou-${student.id}`} />
                          <label 
                            htmlFor={`faltou-${student.id}`} 
                            className="text-sm font-medium cursor-pointer text-red-600"
                          >
                            Faltou
                          </label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClass && selectedSubject && selectedDate && classStudents.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum aluno encontrado nesta turma.</p>
        </div>
      )}

      {/* Lista de presenças registradas */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Presenças Registradas</h2>
        {Object.values(groupedAttendances).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Nenhuma presença registrada ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {Object.values(groupedAttendances).map((group) => {
              const subject = subjects.find(s => s.id === group.subjectId);
              
              // Filtrar apenas presenças do professor logado
              if (subject?.teacherId !== user?.id) return null;

              const classData = classes.find(c => c.id === group.classId);
              const presentCount = group.attendances.filter(att => att.present).length;
              const totalCount = group.attendances.length;
              const attendanceRate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;
              const cardKey = `${group.date}-${group.subjectId}-${group.classId}`;
              const isExpanded = expandedCards.has(cardKey);

              return (
                <Card key={cardKey} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader 
                    className="pb-3"
                    onClick={() => toggleCardExpansion(cardKey)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{subject?.name}</CardTitle>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {classData?.name} • {new Date(group.date).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-sm text-gray-600">
                          Presentes: {presentCount}/{totalCount} • Taxa: {attendanceRate.toFixed(1)}%
                        </p>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAttendance(group)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportAttendance(group)}
                          className="flex items-center gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          Exportar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAttendance(group)}
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
                        <h4 className="font-medium text-gray-900 mb-3">Detalhes da Presença:</h4>
                        {group.attendances.map((attendance) => {
                          const student = students.find(s => s.id === attendance.studentId);
                          return (
                            <div 
                              key={attendance.id} 
                              className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{student?.name}</p>
                                <p className="text-sm text-gray-500">Matrícula: {student?.registration}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span 
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    attendance.present 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {attendance.present ? 'Presente' : 'Faltou'}
                                </span>
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

export default Attendance;
