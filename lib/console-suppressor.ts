// Interceptar e filtrar logs específicos
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  // Filtrar erros específicos de tabelas não configuradas
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Não mostrar erros de tabelas não configuradas
    if (message.includes('cartoes_usuario') && 
        (message.includes('does not exist') || message.includes('não existe'))) {
      return;
    }
    
    originalConsoleError.apply(console, args);
  };

  // Manter warnings mas filtrar alguns específicos
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    // Permitir warnings mas filtrar duplicatas
    if (message.includes('⚠️ Tabela cartoes_usuario não configurada')) {
      // Só mostra uma vez por sessão
      if (!(window as any)._cartoesWarningShown) {
        (window as any)._cartoesWarningShown = true;
        originalConsoleWarn.apply(console, args);
      }
      return;
    }
    
    originalConsoleWarn.apply(console, args);
  };
}

// Suprimir todos os logs de console em produção
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
}

export {};
