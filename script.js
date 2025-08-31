document.addEventListener('DOMContentLoaded', () => {
    // 1. 필요한 HTML 요소들 가져오기
    const appIcons = document.querySelectorAll('.app-icon');
    const appViews = document.querySelectorAll('.app-view');
    const backButtons = document.querySelectorAll('.back-btn');
    const homeScreen = document.getElementById('home-screen');

    const apiKeyInput = document.getElementById('api-key');
    const userPersonaInput = document.getElementById('user-persona');
    const userNoteInput = document.getElementById('user-note');
    const geminiModelInput = document.getElementById('gemini-model');
    const contextSizeInput = document.getElementById('context-size'); // 기억할 대화 수
    const jsonUploadInput = document.getElementById('json-upload');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    const chatLogContainer = document.querySelector('#charactalk-app .chat-log');
    const characterNameHeader = document.querySelector('#charactalk-app .character-name');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    
    let fullChatHistory = []; // JSON에서 불러온 전체 대화 기록을 저장하는 배열

    // 2. 핵심 기능 함수 (화면 전환, 설정)
    function openApp(appId) {
        appViews.forEach(view => view.classList.remove('active'));
        const targetApp = document.querySelector(`.app-view[data-app-id="${appId}"]`);
        if (targetApp) targetApp.classList.add('active');
    }

    function goHome() {
        appViews.forEach(view => view.classList.remove('active'));
        homeScreen.classList.add('active');
    }

    function saveSettings() {
        localStorage.setItem('geminiApiKey', apiKeyInput.value);
        localStorage.setItem('geminiModel', geminiModelInput.value);
        localStorage.setItem('userPersona', userPersonaInput.value);
        localStorage.setItem('userNote', userNoteInput.value);
        localStorage.setItem('contextSize', contextSizeInput.value);
        // JSON은 이미 파일 업로드 시점에 저장되므로 여기서는 저장하지 않아도 됨
        alert('설정이 저장되었습니다!');
    }

    function loadSettings() {
        apiKeyInput.value = localStorage.getItem('geminiApiKey') || '';
        geminiModelInput.value = localStorage.getItem('geminiModel') || 'gemini-1.5-flash-latest';
        userPersonaInput.value = localStorage.getItem('userPersona') || '';
        userNoteInput.value = localStorage.getItem('userNote') || '';
        contextSizeInput.value = localStorage.getItem('contextSize') || '20'; // 기본값 20
    }

    // 3. 데이터 처리 및 표시 함수 (JSON 구조에 맞게 수정)
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonString = e.target.result;
                const data = JSON.parse(jsonString);
                
                // 새로운 JSON 구조에 맞춰 데이터 처리
                localStorage.setItem('chatLogJSON', jsonString); // 원본 JSON 저장
                processAndDisplayChat(data); // 데이터 처리 및 표시 함수 호출
                
                alert(`${data.characterName || '캐릭터'}의 로그가 성공적으로 주입되었습니다.`);
            } catch (error) {
                alert('올바른 JSON 파일이 아닙니다.');
                console.error("JSON 파싱 오류:", error);
            }
        };
        reader.readAsText(file);
    }
    
    function loadChatLogFromStorage() {
        const savedJSONString = localStorage.getItem('chatLogJSON');
        if (savedJSONString) {
            try {
                const data = JSON.parse(savedJSONString);
                processAndDisplayChat(data);
                console.log('로컬 스토리지에서 채팅 로그를 불러왔습니다.');
            } catch (error) {
                console.error('로컬 스토리지 JSON 파싱 오류:', error);
            }
        }
    }

    /**
     * 불러온 JSON 데이터를 처리하고 화면에 표시하는 함수
     * @param {object} data - 파싱된 JSON 데이터 객체
     */
    function processAndDisplayChat(data) {
        // 캐릭터 이름 설정
        characterNameHeader.textContent = data.characterName || '캐릭터';
        
        // userPersona 객체가 있으면 input에 반영 (없으면 기존 설정 유지)
        if(data.userPersona && data.userPersona.information) {
            userPersonaInput.value = data.userPersona.information;
        }

        // messages 배열을 fullChatHistory에 저장
        if (data.messages && Array.isArray(data.messages)) {
            fullChatHistory = data.messages;
            displayChatHistory(); // 화면에 전체 채팅 내역 표시
        }
    }

    /**
     * fullChatHistory 내용을 채팅창에 그리는 함수
     */
    function displayChatHistory() {
        chatLogContainer.innerHTML = ''; // 채팅창 비우기
        fullChatHistory.forEach(message => {
            appendBubble(message.content, message.role);
        });
        // 스크롤을 맨 아래로 이동
        chatLogContainer.scrollTop = chatLogContainer.scrollHeight;
    }

    /**
     * 채팅 말풍선을 화면에 추가하는 함수
     * @param {string} text - 말풍선에 들어갈 텍스트
     * @param {string} role - 'user' 또는 'assistant'/'model'
     */
    function appendBubble(text, role) {
        const bubble = document.createElement('div');
        bubble.classList.add('chat-bubble');
        bubble.textContent = text;
        if (role === 'user') {
            bubble.classList.add('user');
        } else {
            bubble.classList.add('character');
        }
        chatLogContainer.appendChild(bubble);
        // 새 메시지가 추가될 때마다 스크롤을 맨 아래로
        chatLogContainer.scrollTop = chatLogContainer.scrollHeight;
    }

    // 4. 이벤트 리스너 및 초기화
    appIcons.forEach(icon => icon.addEventListener('click', () => openApp(icon.dataset.app)));
    backButtons.forEach(button => button.addEventListener('click', goHome));
    saveSettingsBtn.addEventListener('click', saveSettings);
    jsonUploadInput.addEventListener('change', handleFileUpload);
    
    // TODO: 채팅 전송 이벤트 리스너 추가
    // sendBtn.addEventListener('click', sendChatMessage);
    // messageInput.addEventListener('keydown', (e) => {
    //     if (e.key === 'Enter' && !e.shiftKey) {
    //         e.preventDefault();
    //         sendChatMessage();
    //     }
    // });

    loadSettings();
    loadChatLogFromStorage();
});
