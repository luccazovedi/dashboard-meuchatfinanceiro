// Supressor de logs - Segurança e Privacidade
if (typeof window !== 'undefined') {
  // Suprimir TODOS os logs do console para proteger informações sensíveis
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.trace = () => {};
  console.table = () => {};
  console.group = () => {};
  console.groupCollapsed = () => {};
  console.groupEnd = () => {};
  console.time = () => {};
  console.timeEnd = () => {};
  console.timeLog = () => {};
  console.count = () => {};
  console.countReset = () => {};
  console.clear = () => {};
  console.dir = () => {};
  console.dirxml = () => {};
  console.assert = () => {};
  
  // Desabilitar debugger statements
  (window as any).debugger = undefined;
  
  // Interceptar e suprimir erros não tratados que possam expor informações
  window.addEventListener('error', (e) => {
    e.preventDefault();
    return false;
  });
  
  window.addEventListener('unhandledrejection', (e) => {
    e.preventDefault();
    return false;
  });
}

export {};
