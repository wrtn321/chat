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
    const jsonUploadInput = document.getElementById('json-upload');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    // 채팅 관련 요소
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    
    // 데이터를 저장할 변수
    let chatLogData = null; // 업로드된 JSON 데이터가 저장될 곳


    // --- 2. 핵심 기능 함수 ---

    /**
     * 특정 앱을 화면에 보여주는 함수
     * @param {string} appId - 보여줄 앱의 ID (html의 data-app 속성값)
     */
    function openApp(appId) {
        appViews.forEach(view => view.classList.remove('active'));
        const targetApp = document.querySelector(`.app-view[data-app-id="${appId}"]`);
        if (targetApp) {
            targetApp.classList.add('active');
        }
    }

    /**
     * 홈 화면으로 돌아가는 함수
     */
    function goHome() {
        appViews.forEach(view => view.classList.remove('active'));
        homeScreen.classList.add('active');
    }

    /**
     * 설정 값을 브라우저의 로컬 스토리지에 저장하는 함수
     */
    function saveSettings() {
        // localStorage는 브라우저에 데이터를 문자열 형태로 저장하는 작은 저장소입니다.
        localStorage.setItem('geminiApiKey', apiKeyInput.value);
        localStorage.setItem('userPersona', userPersonaInput.value);
        localStorage.setItem('userNote', userNoteInput.value);

        alert('설정이 저장되었습니다!'); // 사용자에게 저장되었음을 알림
    }

    /**
     * 로컬 스토리지에서 설정 값을 불러와 입력창에 채워주는 함수
     */
    function loadSettings() {
        apiKeyInput.value = localStorage.getItem('geminiApiKey') || '';
        userPersonaInput.value = localStorage.getItem('userPersona') || '';
        userNoteInput.value = localStorage.getItem('userNote') || '';
    }

    /**
     * 사용자가 업로드한 JSON 파일을 읽어서 변수에 저장하는 함수
     * @param {Event} event - 파일 입력(input) 이벤트 객체
     */
    function handleFileUpload(event) {
        const file = event.target.files[0]; // 사용자가 선택한 파일
        if (!file) {
            return; // 파일이 선택되지 않았으면 함수 종료
        }

        const reader = new FileReader(); // 파일을 읽기 위한 객체 생성

        // 파일 읽기가 완료되었을 때 실행될 함수 설정
        reader.onload = (e) => {
            try {
                // 읽어온 파일 내용(문자열)을 JSON 객체로 변환
                chatLogData = JSON.parse(e.target.result);
                console.log('JSON 파일 로딩 및 파싱 성공:', chatLogData);
                alert(`${file.name} 파일이 성공적으로 주입되었습니다.`);
                
                // TODO: 다음 단계에서 이 함수를 호출할 예정
                // classifyAndDisplayLogs(); 
            } catch (error) {
                console.error('JSON 파싱 오류:', error);
                alert('올바른 JSON 파일이 아닙니다.');
            }
        };

        // 파일을 텍스트 형식으로 읽기 시작
        reader.readAsText(file);
    }


    // --- 3. 이벤트 리스너(Event Listeners) 설정 ---

    // 앱 아이콘 클릭 이벤트
    appIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const appId = icon.dataset.app;
            openApp(appId);
        });
    });

    // '홈' 버튼 클릭 이벤트
    backButtons.forEach(button => {
        button.addEventListener('click', goHome);
    });

    // 설정 저장 버튼 클릭 이벤트
    saveSettingsBtn.addEventListener('click', saveSettings);

    // JSON 파일 업로드 이벤트
    jsonUploadInput.addEventListener('change', handleFileUpload);


    // --- 4. 초기화 실행 ---

    // 페이지가 처음 로드될 때, 저장된 설정 값을 불러옴
    loadSettings();


    // --- 5. 앞으로 구현될 기능들 ---

    /**
     * TODO: (다음 단계) JSON 데이터를 AI로 분류하고 화면에 표시하는 함수
     */
    function classifyAndDisplayLogs() {
        if (!chatLogData) {
            alert('먼저 JSON 파일을 주입해주세요.');
            return;
        }
        
        const apiKey = apiKeyInput.value;
        if (!apiKey) {
            alert('설정에서 Gemini API 키를 먼저 입력해주세요.');
            return;
        }

        console.log("AI 분류를 시작합니다...");
        // 1. chatLogData.conversations 배열을 순회
        // 2. 각 대화(conversation)마다 Gemini API에 분류 요청 (프롬프트와 함께)
        // 3. API 응답(전화/문자/카톡)에 따라 데이터를 각각의 배열에 저장
        // 4. 저장된 데이터를 기반으로 HTML 요소를 동적으로 생성
        // 5. 생성된 요소를 각 앱의 콘텐츠 영역에 추가 (예: #call-log-list)
    }

    /**
     * TODO: (마지막 단계) 캐릭터톡 채팅 기능 구현
     */
    function sendChatMessage() {
        console.log("채팅 메시지 전송 로직 구현...");
        // 1. 사용자가 입력한 메시지 가져오기
        // 2. 대화 기록, 프롬프트, 새 메시지를 조합하여 Gemini API에 대화 생성 요청
        // 3. 응답 받은 후, 나와 캐릭터의 메시지를 채팅창에 추가
    }

});
