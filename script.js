// DOM(Document Object Model)이 모두 로드된 후에 스크립트를 실행합니다.
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. 필요한 HTML 요소들 가져오기 ---
    // 화면 전환 관련 요소
    const appIcons = document.querySelectorAll('.app-icon');
    const appViews = document.querySelectorAll('.app-view');
    const backButtons = document.querySelectorAll('.back-btn');
    const homeScreen = document.getElementById('home-screen');

    // 설정 앱 관련 요소
    const apiKeyInput = document.getElementById('api-key');
    const userPersonaInput = document.getElementById('user-persona');
    const userNoteInput = document.getElementById('user-note');
    const geminiModelInput = document.getElementById('gemini-model'); // 새로 추가
    const jsonUploadInput = document.getElementById('json-upload');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    // 데이터를 저장할 변수
    let chatLogData = null; // 업로드되거나, 로컬 스토리지에서 불러온 JSON 데이터가 저장될 곳


    // --- 2. 핵심 기능 함수 ---

    function openApp(appId) {
        appViews.forEach(view => view.classList.remove('active'));
        const targetApp = document.querySelector(`.app-view[data-app-id="${appId}"]`);
        if (targetApp) {
            targetApp.classList.add('active');
        }
    }

    function goHome() {
        appViews.forEach(view => view.classList.remove('active'));
        homeScreen.classList.add('active');
    }

    /**
     * 설정 값을 브라우저의 로컬 스토리지에 저장하는 함수
     */
    function saveSettings() {
        localStorage.setItem('geminiApiKey', apiKeyInput.value);
        localStorage.setItem('geminiModel', geminiModelInput.value); // 모델 정보 저장 추가
        localStorage.setItem('userPersona', userPersonaInput.value);
        localStorage.setItem('userNote', userNoteInput.value);
        
        // JSON 데이터도 로컬 스토리지에 저장 (문자열 형태로)
        if (chatLogData) {
            // JSON.stringify는 자바스크립트 객체를 JSON 문자열로 변환해줍니다.
            // 로컬 스토리지는 문자열만 저장할 수 있기 때문에 꼭 필요한 과정입니다.
            localStorage.setItem('chatLogJSON', JSON.stringify(chatLogData));
            alert('설정 및 채팅 로그가 저장되었습니다!');
        } else {
            alert('설정이 저장되었습니다! (채팅 로그는 아직 주입되지 않음)');
        }
    }

    /**
     * 로컬 스토리지에서 설정 값을 불러와 입력창에 채워주는 함수
     */
    function loadSettings() {
        apiKeyInput.value = localStorage.getItem('geminiApiKey') || '';
        // 저장된 모델명이 없으면 기본으로 'gemini-1.5-flash-latest'를 채워줍니다.
        geminiModelInput.value = localStorage.getItem('geminiModel') || 'gemini-1.5-flash-latest';
        userPersonaInput.value = localStorage.getItem('userPersona') || '';
        userNoteInput.value = localStorage.getItem('userNote') || '';
    }

    /**
     * 사용자가 업로드한 JSON 파일을 읽어서 변수와 로컬 스토리지에 저장하는 함수
     */
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonString = e.target.result;
                // 읽어온 파일 내용(문자열)을 JSON 객체로 변환
                chatLogData = JSON.parse(jsonString);
                
                // **중요: 읽어온 JSON 데이터를 바로 로컬 스토리지에도 저장**
                localStorage.setItem('chatLogJSON', jsonString);

                console.log('JSON 파일 로딩 및 저장 성공:', chatLogData);
                alert(`${file.name} 파일이 성공적으로 주입 및 저장되었습니다.`);
                
                // TODO: 다음 단계에서 이 함수를 호출할 예정
                // classifyAndDisplayLogs(); 

            } catch (error) {
                console.error('JSON 파싱 오류:', error);
                alert('올바른 JSON 파일이 아닙니다.');
            }
        };
        reader.readAsText(file);
    }

    /**
     * 페이지 시작 시 로컬 스토리지에서 채팅 로그를 불러오는 함수
     */
    function loadChatLogFromStorage() {
        const savedJSONString = localStorage.getItem('chatLogJSON');
        if (savedJSONString) {
            try {
                // 로컬 스토리지에서 가져온 JSON 문자열을 다시 자바스크립트 객체로 변환
                chatLogData = JSON.parse(savedJSONString);
                console.log('로컬 스토리지에서 채팅 로그를 성공적으로 불러왔습니다:', chatLogData);
                // TODO: 다음 단계에서 이 함수를 호출할 예정
                // classifyAndDisplayLogs(); 
            } catch (error) {
                console.error('로컬 스토리지의 JSON 파싱 오류:', error);
            }
        }
    }


    // --- 3. 이벤트 리스너(Event Listeners) 설정 ---

    appIcons.forEach(icon => {
        icon.addEventListener('click', () => openApp(icon.dataset.app));
    });

    backButtons.forEach(button => {
        button.addEventListener('click', goHome);
    });

    saveSettingsBtn.addEventListener('click', saveSettings);
    jsonUploadInput.addEventListener('change', handleFileUpload);


    // --- 4. 초기화 실행 ---
    loadSettings(); // 설정 값(API 키 등) 불러오기
    loadChatLogFromStorage(); // 채팅 로그(JSON) 불러오기

});
