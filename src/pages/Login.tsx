
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register, logout, resetPassword, updatePassword, isAuthenticated } = useAuth();

  // Estados para cadastro
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerRole, setRegisterRole] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [permissionPassword, setPermissionPassword] = useState('');
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);

  // Estados para esqueci senha
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotDialogOpen, setIsForgotDialogOpen] = useState(false);

  // Estados para alterar senha
  const [changeEmail, setChangeEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changePermissionPassword, setChangePermissionPassword] = useState('');
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);

  // Redirecionar se já estiver autenticado
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo ao sistema!",
        });
      } else {
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (permissionPassword !== 'admin123') {
      toast({
        title: "Erro no cadastro",
        description: "Senha de permissão incorreta",
        variant: "destructive",
      });
      return;
    }

    if (!registerEmail || !registerName || !registerRole || !registerPassword) {
      toast({
        title: "Erro no cadastro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    if (registerPassword.length < 6) {
      toast({
        title: "Erro no cadastro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      await register(
        registerEmail,
        registerPassword,
        registerName,
        registerRole as 'admin' | 'professor'
      );

      toast({
        title: "Usuário cadastrado",
        description: `${registerRole === 'admin' ? 'Administrador' : 'Professor'} cadastrado com sucesso!`,
      });

      // Limpar formulário
      setRegisterEmail('');
      setRegisterName('');
      setRegisterRole('');
      setRegisterPassword('');
      setPermissionPassword('');
      
      // Adicionar um pequeno atraso antes de fechar o diálogo
      setTimeout(() => {
        setIsRegisterDialogOpen(false);
      }, 100);
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao cadastrar o usuário",
        variant: "destructive",
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotEmail) {
      toast({
        title: "Erro",
        description: "Digite seu email",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await resetPassword(forgotEmail);
      
      if (success) {
        toast({
          title: "Email enviado",
          description: "Verifique sua caixa de entrada para redefinir a senha",
        });
        
        setForgotEmail('');
        setIsForgotDialogOpen(false);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível enviar o email de redefinição",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar o email de redefinição",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (changePermissionPassword !== 'admin123') {
      toast({
        title: "Erro",
        description: "Senha de permissão incorreta",
        variant: "destructive",
      });
      return;
    }

    if (!changeEmail || !currentPassword || !newPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    try {
      // Primeiro fazer login com as credenciais atuais
      const loginSuccess = await login(changeEmail, currentPassword);
      
      if (loginSuccess) {
        // Depois atualizar a senha
        const updateSuccess = await updatePassword(newPassword);
        
        if (updateSuccess) {
          toast({
            title: "Senha alterada",
            description: "Senha alterada com sucesso",
          });
          
          setChangeEmail('');
          setCurrentPassword('');
          setNewPassword('');
          setChangePermissionPassword('');
          setIsChangePasswordDialogOpen(false);
          
          // Fazer logout para forçar novo login com a nova senha
          await logout();
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível alterar a senha",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Erro",
          description: "Email ou senha atual incorretos",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao alterar a senha",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 via-red-400 to-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-blue-800">ETDA</CardTitle>
          <p className="text-gray-600">Sistema de Administração Escolar</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 space-y-2">
            {/* Cadastro */}
            <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Cadastrar Admin/Professor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Usuário</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome</label>
                    <Input
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="Email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tipo de Usuário</label>
                    <Select value={registerRole} onValueChange={setRegisterRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="professor">Professor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Senha</label>
                    <Input
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Digite a senha do usuário"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Senha de Permissão</label>
                    <Input
                      type="password"
                      value={permissionPassword}
                      onChange={(e) => setPermissionPassword(e.target.value)}
                      placeholder="Digite a senha de permissão"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      Cadastrar
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsRegisterDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Esqueci Senha */}
            <Dialog open={isForgotDialogOpen} onOpenChange={setIsForgotDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full text-sm">
                  Esqueci minha senha
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Recuperar Senha</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Digite seu email"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      Enviar
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsForgotDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Alterar Senha */}
            <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full text-sm">
                  Alterar senha
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Alterar Senha</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      value={changeEmail}
                      onChange={(e) => setChangeEmail(e.target.value)}
                      placeholder="Seu email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Senha Atual</label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Senha atual"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nova Senha</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nova senha"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Senha de Permissão</label>
                    <Input
                      type="password"
                      value={changePermissionPassword}
                      onChange={(e) => setChangePermissionPassword(e.target.value)}
                      placeholder="Digite a senha de permissão"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      Alterar
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsChangePasswordDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
