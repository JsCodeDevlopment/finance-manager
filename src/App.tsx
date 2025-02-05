import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { Dashboard } from './components/Dashboard';
import { LogIn } from 'lucide-react';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [view, setView] = useState<'dashboard' | 'transactions'>('dashboard');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) fetchTransactions();
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchTransactions();
    });
  }, []);

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (data) {
      setTransactions(data);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = isSignUp
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin,
            },
          })
        : await supabase.auth.signInWithPassword({
            email,
            password,
          });

      if (error) {
        throw error;
      }

      if (isSignUp) {
        alert('Cadastro realizado com sucesso! Você já pode fazer login.');
        setIsSignUp(false);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setTransactions([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <div className="flex items-center justify-center mb-8">
            <LogIn className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold ml-2">Gerenciador Financeiro</h1>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isSignUp ? 'Cadastrar' : 'Entrar'}
            </button>
          </form>

          <div className="mt-4">
            <p className="text-center text-sm text-gray-600">
              {isSignUp ? 'Já tem uma conta?' : "Não tem uma conta?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 hover:text-blue-500"
              >
                {isSignUp ? 'Entrar' : 'Cadastrar'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Gerenciador Financeiro</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setView('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  view === 'dashboard'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Painel
              </button>
              <button
                onClick={() => setView('transactions')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  view === 'transactions'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Transações
              </button>
              <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {view === 'dashboard' ? (
            <Dashboard transactions={transactions} />
          ) : (
            <div className="space-y-8">
              <TransactionForm onTransactionAdded={fetchTransactions} />
              <TransactionList
                transactions={transactions}
                onTransactionUpdated={fetchTransactions}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;