export async function requestJson(path, options = {}) {
  let response;
  try { response = await fetch(path, options); }
  catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Falha de conexão com o aplicativo. Confira se o backend Python está rodando.');
  }
  let data;
  try { data = await response.json(); }
  catch { throw new Error('O servidor não retornou JSON. Confira se o backend Python está rodando e se o proxy está configurado.'); }
  if (!response.ok) throw new Error(data.error?.message || 'Não foi possível concluir o pedido. Tente novamente.');
  return data;
}
