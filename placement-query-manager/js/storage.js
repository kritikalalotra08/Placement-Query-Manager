const STORE_KEY = 'ait_pqm_data';
const SESSION_KEY = 'ait_pqm_session';

function loadData(){
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
  } catch(e){
    return null;
  }
}

function saveData(data){
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

function saveSession(session){
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function loadSession(){
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch(e){
    return null;
  }
}

function clearSession(){
  localStorage.removeItem(SESSION_KEY);
}