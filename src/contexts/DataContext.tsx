import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Student {
  id: string;
  name: string;
  email: string;
  registration: string;
  classId: string;
  phone: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
}

export interface Subject {
  id: string;
  name: string;
  teacherId: string;
  workload: number;
}

export interface Class {
  id: string;
  name: string;
  year: number;
  period: string;
  studentIds: string[];
}

export interface Attendance {
  id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  date: string;
  present: boolean;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  quarter: number;
  value: number;
}

interface DataContextType {
  students: Student[];
  teachers: Teacher[];
  subjects: Subject[];
  classes: Class[];
  attendances: Attendance[];
  grades: Grade[];
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, subject: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  addClass: (classData: Omit<Class, 'id'>) => void;
  updateClass: (id: string, classData: Partial<Class>) => void;
  deleteClass: (id: string) => void;
  addAttendance: (attendance: Omit<Attendance, 'id'>) => void;
  updateAttendance?: (id: string, attendance: Partial<Attendance>) => void;
  deleteAttendance?: (id: string) => void;
  addGrade: (grade: Omit<Grade, 'id'>) => void;
  updateGrade?: (id: string, grade: Partial<Grade>) => void;
  deleteGrade?: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados do Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Carregar estudantes
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*');
        
        if (studentsError) throw studentsError;
        if (studentsData) {
          const formattedStudents: Student[] = studentsData.map(student => ({
            id: student.id,
            name: student.name,
            email: student.email,
            registration: student.registration,
            classId: student.class_id || '',
            phone: student.phone || ''
          }));
          setStudents(formattedStudents);
        }
        
        // Carregar professores
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'professor');
        
        if (profilesError) throw profilesError;
        
        // Carregar disciplinas para associar aos professores
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*');
        
        if (subjectsError) throw subjectsError;
        
        if (profilesData) {
          const formattedTeachers: Teacher[] = profilesData.map(profile => {
            // Encontrar disciplinas associadas a este professor
            const teacherSubjects = subjectsData
              ? subjectsData
                  .filter(subject => subject.teacher_id === profile.id)
                  .map(subject => subject.id)
              : [];
            
            return {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              phone: profile.phone || '',
              subjects: teacherSubjects
            };
          });
          
          setTeachers(formattedTeachers);
        }
        
        // Formatar e salvar disciplinas
        if (subjectsData) {
          const formattedSubjects: Subject[] = subjectsData.map(subject => ({
            id: subject.id,
            name: subject.name,
            teacherId: subject.teacher_id || '',
            workload: subject.workload || 0
          }));
          
          setSubjects(formattedSubjects);
        }
        
        // Carregar turmas
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*');
        
        if (classesError) throw classesError;
        
        if (classesData) {
          // Para cada turma, precisamos buscar os alunos associados
          const formattedClasses: Class[] = await Promise.all(
            classesData.map(async (classItem) => {
              // Buscar alunos desta turma
              const { data: classStudents } = await supabase
                .from('students')
                .select('id')
                .eq('class_id', classItem.id);
              
              return {
                id: classItem.id,
                name: classItem.name,
                year: classItem.year,
                period: classItem.period,
                studentIds: classStudents ? classStudents.map(s => s.id) : []
              };
            })
          );
          
          setClasses(formattedClasses);
        }
        
        // Carregar presenças
        const { data: attendancesData, error: attendancesError } = await supabase
          .from('attendances')
          .select('*');
        
        if (attendancesError) throw attendancesError;
        
        if (attendancesData) {
          const formattedAttendances: Attendance[] = attendancesData.map(attendance => ({
            id: attendance.id,
            studentId: attendance.student_id || '',
            subjectId: attendance.subject_id || '',
            classId: attendance.class_id || '',
            date: attendance.date,
            present: attendance.present
          }));
          
          setAttendances(formattedAttendances);
        }
        
        // Carregar notas
        const { data: gradesData, error: gradesError } = await supabase
          .from('grades')
          .select('*');
        
        if (gradesError) throw gradesError;
        
        if (gradesData) {
          const formattedGrades: Grade[] = gradesData.map(grade => ({
            id: grade.id,
            studentId: grade.student_id || '',
            subjectId: grade.subject_id || '',
            quarter: grade.quarter,
            value: grade.value
          }));
          
          setGrades(formattedGrades);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  const addStudent = async (student: Omit<Student, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([
          {
            name: student.name,
            email: student.email,
            registration: student.registration,
            class_id: student.classId,
            phone: student.phone
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const newStudent: Student = {
          id: data[0].id,
          name: data[0].name,
          email: data[0].email,
          registration: data[0].registration,
          classId: data[0].class_id || '',
          phone: data[0].phone || ''
        };
        
        setStudents(prev => [...prev, newStudent]);
      }
    } catch (error) {
      console.error('Erro ao adicionar estudante:', error);
    }
  };

  const updateStudent = async (id: string, student: Partial<Student>) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: student.name,
          email: student.email,
          registration: student.registration,
          class_id: student.classId,
          phone: student.phone
        })
        .eq('id', id);
      
      if (error) throw error;
      
      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...student } : s));
    } catch (error) {
      console.error('Erro ao atualizar estudante:', error);
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Erro ao excluir estudante:', error);
    }
  };

  const addTeacher = async (teacher: Omit<Teacher, 'id'>) => {
    try {
      // Criar um usuário no Auth e um perfil
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Registrar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: teacher.email,
        password: tempPassword,
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Criar perfil na tabela profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: teacher.email,
              name: teacher.name,
              role: 'professor',
              phone: teacher.phone
            },
          ])
          .select();
        
        if (profileError) throw profileError;
        
        if (profileData && profileData[0]) {
          const newTeacher: Teacher = {
            id: profileData[0].id,
            name: profileData[0].name,
            email: profileData[0].email,
            phone: profileData[0].phone || '',
            subjects: teacher.subjects || []
          };
          
          setTeachers(prev => [...prev, newTeacher]);
          
          // Retornar a senha temporária para ser exibida ao usuário
          return { teacher: newTeacher, tempPassword };
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar professor:', error);
    }
  };

  const updateTeacher = async (id: string, teacher: Partial<Teacher>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone
        })
        .eq('id', id)
        .eq('role', 'professor');
      
      if (error) throw error;
      
      setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...teacher } : t));
      
      // Se houver alteração nas disciplinas, precisamos atualizar cada disciplina
      if (teacher.subjects) {
        // Primeiro, obter todas as disciplinas atuais deste professor
        const { data: currentSubjects } = await supabase
          .from('subjects')
          .select('id')
          .eq('teacher_id', id);
        
        const currentSubjectIds = currentSubjects ? currentSubjects.map(s => s.id) : [];
        
        // Remover professor de disciplinas que não estão mais na lista
        const subjectsToRemove = currentSubjectIds.filter(sid => !teacher.subjects?.includes(sid));
        
        if (subjectsToRemove.length > 0) {
          await supabase
            .from('subjects')
            .update({ teacher_id: null })
            .in('id', subjectsToRemove);
        }
        
        // Adicionar professor a novas disciplinas
        const subjectsToAdd = teacher.subjects.filter(sid => !currentSubjectIds.includes(sid));
        
        if (subjectsToAdd.length > 0) {
          for (const subjectId of subjectsToAdd) {
            await supabase
              .from('subjects')
              .update({ teacher_id: id })
              .eq('id', subjectId);
          }
        }
        
        // Atualizar as disciplinas no estado local
        setSubjects(prev => prev.map(s => {
          if (subjectsToAdd.includes(s.id)) {
            return { ...s, teacherId: id };
          } else if (subjectsToRemove.includes(s.id)) {
            return { ...s, teacherId: '' };
          }
          return s;
        }));
      }
    } catch (error) {
      console.error('Erro ao atualizar professor:', error);
    }
  };

  const deleteTeacher = async (id: string) => {
    try {
      // Primeiro, remover o professor de todas as disciplinas
      await supabase
        .from('subjects')
        .update({ teacher_id: null })
        .eq('teacher_id', id);
      
      // Depois, excluir o perfil
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
        .eq('role', 'professor');
      
      if (error) throw error;
      
      // Atualizar estado local
      setTeachers(prev => prev.filter(t => t.id !== id));
      setSubjects(prev => prev.map(s => s.teacherId === id ? { ...s, teacherId: '' } : s));
    } catch (error) {
      console.error('Erro ao excluir professor:', error);
    }
  };

  const addSubject = async (subject: Omit<Subject, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert([
          {
            name: subject.name,
            teacher_id: subject.teacherId || null,
            workload: subject.workload
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const newSubject: Subject = {
          id: data[0].id,
          name: data[0].name,
          teacherId: data[0].teacher_id || '',
          workload: data[0].workload
        };
        
        setSubjects(prev => [...prev, newSubject]);
        
        // Se houver um professor associado, atualizar a lista de disciplinas do professor
        if (newSubject.teacherId) {
          setTeachers(prev => prev.map(t => {
            if (t.id === newSubject.teacherId) {
              return { ...t, subjects: [...t.subjects, newSubject.id] };
            }
            return t;
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar disciplina:', error);
    }
  };

  const updateSubject = async (id: string, subject: Partial<Subject>) => {
    try {
      // Obter a disciplina atual para verificar se o professor mudou
      const currentSubject = subjects.find(s => s.id === id);
      const oldTeacherId = currentSubject?.teacherId;
      
      const { error } = await supabase
        .from('subjects')
        .update({
          name: subject.name,
          teacher_id: subject.teacherId || null,
          workload: subject.workload
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Atualizar estado local da disciplina
      setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...subject } : s));
      
      // Se o professor mudou, atualizar as listas de disciplinas dos professores
      if (subject.teacherId !== undefined && oldTeacherId !== subject.teacherId) {
        // Remover a disciplina do professor antigo
        if (oldTeacherId) {
          setTeachers(prev => prev.map(t => {
            if (t.id === oldTeacherId) {
              return { ...t, subjects: t.subjects.filter(sid => sid !== id) };
            }
            return t;
          }));
        }
        
        // Adicionar a disciplina ao novo professor
        if (subject.teacherId) {
          setTeachers(prev => prev.map(t => {
            if (t.id === subject.teacherId) {
              return { ...t, subjects: [...t.subjects, id] };
            }
            return t;
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar disciplina:', error);
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      // Obter a disciplina atual para remover da lista do professor
      const currentSubject = subjects.find(s => s.id === id);
      
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Atualizar estado local
      setSubjects(prev => prev.filter(s => s.id !== id));
      
      // Remover a disciplina da lista do professor
      if (currentSubject?.teacherId) {
        setTeachers(prev => prev.map(t => {
          if (t.id === currentSubject.teacherId) {
            return { ...t, subjects: t.subjects.filter(sid => sid !== id) };
          }
          return t;
        }));
      }
    } catch (error) {
      console.error('Erro ao excluir disciplina:', error);
    }
  };

  const addClass = async (classData: Omit<Class, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert([
          {
            name: classData.name,
            year: classData.year,
            period: classData.period
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const newClass: Class = {
          id: data[0].id,
          name: data[0].name,
          year: data[0].year,
          period: data[0].period,
          studentIds: []
        };
        
        setClasses(prev => [...prev, newClass]);
        
        // Se houver alunos associados, atualizar a classe de cada aluno
        if (classData.studentIds && classData.studentIds.length > 0) {
          for (const studentId of classData.studentIds) {
            await supabase
              .from('students')
              .update({ class_id: newClass.id })
              .eq('id', studentId);
          }
          
          // Atualizar o estado local dos alunos
          setStudents(prev => prev.map(s => {
            if (classData.studentIds.includes(s.id)) {
              return { ...s, classId: newClass.id };
            }
            return s;
          }));
          
          // Atualizar a lista de alunos da turma
          newClass.studentIds = classData.studentIds;
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar turma:', error);
    }
  };

  const updateClass = async (id: string, classData: Partial<Class>) => {
    try {
      // Obter a turma atual para verificar mudanças nos alunos
      const currentClass = classes.find(c => c.id === id);
      
      const { error } = await supabase
        .from('classes')
        .update({
          name: classData.name,
          year: classData.year,
          period: classData.period
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Atualizar estado local da turma
      setClasses(prev => prev.map(c => c.id === id ? { ...c, ...classData } : c));
      
      // Se a lista de alunos mudou, atualizar as associações
      if (classData.studentIds && currentClass) {
        // Alunos que foram removidos da turma
        const removedStudents = currentClass.studentIds.filter(
          sid => !classData.studentIds?.includes(sid)
        );
        
        // Alunos que foram adicionados à turma
        const addedStudents = classData.studentIds.filter(
          sid => !currentClass.studentIds.includes(sid)
        );
        
        // Remover alunos da turma
        if (removedStudents.length > 0) {
          await supabase
            .from('students')
            .update({ class_id: null })
            .in('id', removedStudents);
          
          // Atualizar estado local dos alunos
          setStudents(prev => prev.map(s => {
            if (removedStudents.includes(s.id)) {
              return { ...s, classId: '' };
            }
            return s;
          }));
        }
        
        // Adicionar alunos à turma
        if (addedStudents.length > 0) {
          for (const studentId of addedStudents) {
            await supabase
              .from('students')
              .update({ class_id: id })
              .eq('id', studentId);
          }
          
          // Atualizar estado local dos alunos
          setStudents(prev => prev.map(s => {
            if (addedStudents.includes(s.id)) {
              return { ...s, classId: id };
            }
            return s;
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar turma:', error);
    }
  };

  const deleteClass = async (id: string) => {
    try {
      // Obter a turma atual para remover a associação dos alunos
      const currentClass = classes.find(c => c.id === id);
      
      // Primeiro, remover a associação de todos os alunos com esta turma
      await supabase
        .from('students')
        .update({ class_id: null })
        .eq('class_id', id);
      
      // Depois, excluir a turma
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Atualizar estado local
      setClasses(prev => prev.filter(c => c.id !== id));
      
      // Atualizar o estado local dos alunos
      if (currentClass) {
        setStudents(prev => prev.map(s => {
          if (currentClass.studentIds.includes(s.id)) {
            return { ...s, classId: '' };
          }
          return s;
        }));
      }
    } catch (error) {
      console.error('Erro ao excluir turma:', error);
    }
  };

  const addAttendance = async (attendance: Omit<Attendance, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('attendances')
        .insert([
          {
            student_id: attendance.studentId,
            subject_id: attendance.subjectId,
            class_id: attendance.classId,
            date: attendance.date,
            present: attendance.present
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const newAttendance: Attendance = {
          id: data[0].id,
          studentId: data[0].student_id || '',
          subjectId: data[0].subject_id || '',
          classId: data[0].class_id || '',
          date: data[0].date,
          present: data[0].present
        };
        
        setAttendances(prev => [...prev, newAttendance]);
      }
    } catch (error) {
      console.error('Erro ao adicionar presença:', error);
    }
  };

  const updateAttendance = async (id: string, attendance: Partial<Attendance>) => {
    try {
      const { error } = await supabase
        .from('attendances')
        .update({
          student_id: attendance.studentId,
          subject_id: attendance.subjectId,
          class_id: attendance.classId,
          date: attendance.date,
          present: attendance.present
        })
        .eq('id', id);
      
      if (error) throw error;
      
      setAttendances(prev => prev.map(a => a.id === id ? { ...a, ...attendance } : a));
    } catch (error) {
      console.error('Erro ao atualizar presença:', error);
    }
  };

  const deleteAttendance = async (id: string) => {
    try {
      const { error } = await supabase
        .from('attendances')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setAttendances(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Erro ao excluir presença:', error);
    }
  };

  const addGrade = async (grade: Omit<Grade, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('grades')
        .insert([
          {
            student_id: grade.studentId,
            subject_id: grade.subjectId,
            quarter: grade.quarter,
            value: grade.value
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const newGrade: Grade = {
          id: data[0].id,
          studentId: data[0].student_id || '',
          subjectId: data[0].subject_id || '',
          quarter: data[0].quarter,
          value: data[0].value
        };
        
        setGrades(prev => [...prev, newGrade]);
      }
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
    }
  };

  const updateGrade = async (id: string, grade: Partial<Grade>) => {
    try {
      const { error } = await supabase
        .from('grades')
        .update({
          student_id: grade.studentId,
          subject_id: grade.subjectId,
          quarter: grade.quarter,
          value: grade.value
        })
        .eq('id', id);
      
      if (error) throw error;
      
      setGrades(prev => prev.map(g => g.id === id ? { ...g, ...grade } : g));
    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
    }
  };

  const deleteGrade = async (id: string) => {
    try {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setGrades(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error('Erro ao excluir nota:', error);
    }
  };

  return (
    <DataContext.Provider value={{
      students,
      teachers,
      subjects,
      classes,
      attendances,
      grades,
      addStudent,
      updateStudent,
      deleteStudent,
      addTeacher,
      updateTeacher,
      deleteTeacher,
      addSubject,
      updateSubject,
      deleteSubject,
      addClass,
      updateClass,
      deleteClass,
      addAttendance,
      updateAttendance,
      deleteAttendance,
      addGrade,
      updateGrade,
      deleteGrade
    }}>
      {children}
    </DataContext.Provider>
  );
};
