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
    const contextSizeInput = document.getElementById('context-size');
    const jsonUploadInput = document.getElementById('json-upload');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    const chatLogContainer = document.querySelector('#charactalk-app .chat-log');
    const characterNameHeader = document.querySelector('#charactalk-app .character-name');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    
    let fullChatHistory = []; // 전체 대화 기록을 저장하는 배열
    let isGenerating = false; // AI가 응답을 생성 중인지 확인하는 플래그

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
        alert('설정이 저장되었습니다!');
    }

    function loadSettings() {
        apiKeyInput.value = localStorage.getItem('geminiApiKey') || '';
        geminiModelInput.value = localStorage.getItem('geminiModel') || 'gemini-1.5-flash-latest';
        userPersonaInput.value = localStorage.getItem('userPersona') || '';
        userNoteInput.value = localStorage.getItem('userNote') || '';
        contextSizeInput.value = localStorage.getItem('contextSize') || '20';
    }

    // 3. 데이터 처리 및 표시 함수
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonString = e.target.result;
                const data = JSON.parse(jsonString);
                localStorage.setItem('chatLogJSON', jsonString);
                processAndDisplayChat(data);
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

    function processAndDisplayChat(data) {
        characterNameHeader.textContent = data.characterName || '캐릭터';
        if(data.userPersona && data.userPersona.information && !userPersonaInput.value) {
            userPersonaInput.value = data.userPersona.information;
        }
        if (data.messages && Array.isArray(data.messages)) {
            fullChatHistory = data.messages;
            displayChatHistory();
        }
    }

    function displayChatHistory() {
        chatLogContainer.innerHTML = '';
        fullChatHistory.forEach(message => appendBubble(message.content, message.role));
        scrollToBottom();
    }

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
    }

    function scrollToBottom() {
        chatLogContainer.scrollTop = chatLogContainer.scrollHeight;
    }
    
    // --- 4. 채팅 메시지 전송 및 AI 응답 처리 (이번 단계의 핵심) ---

    /**
     * 사용자가 메시지를 보내면 AI에게 응답을 요청하고 화면에 표시하는 메인 함수
     */
    async function sendChatMessage() {
        // AI가 이미 생성 중이면 중복 실행 방지
        if (isGenerating) return;

        const messageText = messageInput.value.trim();
        if (messageText === '') return; // 입력 내용이 없으면 무시

        const apiKey = apiKeyInput.value;
        const model = geminiModelInput.value;
        if (!apiKey) {
            alert('설정에서 Gemini API 키를 먼저 입력해주세요.');
            return;
        }

        // 1. 사용자 메시지를 화면에 즉시 표시
        appendBubble(messageText, 'user');
        const userMessage = { role: 'user', content: messageText };
        fullChatHistory.push(userMessage); // 전체 대화 기록에 추가
        messageInput.value = ''; // 입력창 비우기
        scrollToBottom();

        // 2. AI 응답 생성을 위한 준비
        isGenerating = true;
        sendBtn.disabled = true; // 전송 버튼 비활성화
        appendBubble('입력 중...', 'character'); // '입력 중...' 표시
        scrollToBottom();

        // 3. AI에게 전달할 데이터 구성
        const contextSize = parseInt(contextSizeInput.value, 10);
        // contextSize가 0이면 전체 기록, 아니면 최근 N개만 잘라서 '단기 기억'으로 사용
        const recentHistory = contextSize === 0 ? fullChatHistory : fullChatHistory.slice(-contextSize);
        
        // AI의 역할과 대화 스타일을 정의하는 시스템 프롬프트
        const systemPrompt = `
            ${userPersonaInput.value}
            ${userNoteInput.value}
            위 설정을 바탕으로 대화합니다.
            이제부터 당신은 상대방과 친근하게 대화하는 친구입니다. 길고 서술적인 답변 대신, 실제 카톡을 하듯이 짧고 간결한 단문 중심으로 대답해주세요.
        `;
        
        const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        // 4. Gemini API 호출
        try {
            const response = await fetch(apiURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // 시스템 지시사항과 대화 기록을 함께 전달
                    "system_instruction": { "parts": [{ "text": systemPrompt }] },
                    "contents": recentHistory.map(msg => ({ // API 형식에 맞게 변환
                        role: msg.role === 'user' ? 'user' : 'model', // assistant -> model
                        parts: [{ text: msg.content }]
                    }))
                })
            });

            // '입력 중...' 말풍선 제거
            chatLogContainer.removeChild(chatLogContainer.lastChild);

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`API 오류: ${errorBody.error.message}`);
            }

            const data = await response.json();
            const aiResponseText = data.candidates[0].content.parts[0].text;
            
            // 5. AI 응답을 화면에 표시
            appendBubble(aiResponseText, 'assistant');
            const aiMessage = { role: 'assistant', content: aiResponseText };
            fullChatHistory.push(aiMessage); // 전체 대화 기록에 추가

        } catch (error) {
            console.error("Gemini API 호출 오류:", error);
            appendBubble(`오류가 발생했습니다: ${error.message}`, 'character');
        } finally {
            // 6. 마무리 작업
            isGenerating = false;
            sendBtn.disabled = false; // 전송 버튼 다시 활성화
            scrollToBottom();
        }
    }


    // --- 5. 이벤트 리스너 및 초기화 ---
    appIcons.forEach(icon => icon.addEventListener('click', () => openApp(icon.dataset.app)));
    backButtons.forEach(button => button.addEventListener('click', goHome));
    saveSettingsBtn.addEventListener('click', saveSettings);
    jsonUploadInput.addEventListener('change', handleFileUpload);
    
    // 채팅 전송 이벤트 리스너 활성화
    sendBtn.addEventListener('click', sendChatMessage);
    messageInput.addEventListener('keydown', (e) => {
        // Shift + Enter는 줄바꿈, 그냥 Enter는 전송
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // 기본 동작(줄바꿈) 방지
            sendChatMessage();
        }
    });

    loadSettings();
    loadChatLogFromStorage();
});
