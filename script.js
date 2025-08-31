document.addEventListener('DOMContentLoaded', () => {
    // 1. 필요한 HTML 요소들 가져오기
    const appIcons = document.querySelectorAll('.app-icon');
    const appViews = document.querySelectorAll('.app-view');
    const backButtons = document.querySelectorAll('.back-btn');
    const homeScreen = document.getElementById('home-screen');

    const apiKeyInput = document.getElementById('api-key');
    const userPersonaInput = document.getElementById('user-persona');
    const userNoteInput = document.getElementById('user-note');
    const systemPromptInput = document.getElementById('system-prompt'); // 시스템 프롬프트
    const geminiModelInput = document.getElementById('gemini-model');
    const contextSizeInput = document.getElementById('context-size');
    const jsonUploadInput = document.getElementById('json-upload');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    const chatLogContainer = document.querySelector('#charactalk-app .chat-log');
    const characterNameHeader = document.querySelector('#charactalk-app .character-name');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    
    // 수정/삭제 모달 요소
    const editModal = document.getElementById('edit-modal');
    const modalTextarea = document.getElementById('modal-textarea');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const modalDeleteBtn = document.getElementById('modal-delete-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    let fullChatHistory = [];
    let isGenerating = false;
    let currentlyEditingIndex = -1; // 현재 수정/삭제 중인 메시지의 인덱스

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
        localStorage.setItem('userPersona', userPersonaInput.value);
        localStorage.setItem('userNote', userNoteInput.value);
        localStorage.setItem('systemPrompt', systemPromptInput.value);
        localStorage.setItem('geminiModel', geminiModelInput.value);
        localStorage.setItem('contextSize', contextSizeInput.value);
        alert('설정이 저장되었습니다!');
    }

    function loadSettings() {
        apiKeyInput.value = localStorage.getItem('geminiApiKey') || '';
        userPersonaInput.value = localStorage.getItem('userPersona') || '';
        userNoteInput.value = localStorage.getItem('userNote') || '';
        systemPromptInput.value = localStorage.getItem('systemPrompt') || '실제 카톡을 하듯이 짧고 간결한 단문 중심으로 대답해주세요.';
        geminiModelInput.value = localStorage.getItem('geminiModel') || 'gemini-1.5-flash-latest';
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
            } catch (error) {
                console.error('로컬 스토리지 JSON 파싱 오류:', error);
            }
        }
    }
    
    /**
     * 로컬 스토리지에 현재 채팅 기록을 덮어쓰는 함수
     */
    function updateStoredChatLog() {
        // 현재 fullChatHistory를 기반으로 새로운 JSON 객체를 만들어 저장
        const currentData = JSON.parse(localStorage.getItem('chatLogJSON') || '{}');
        currentData.messages = fullChatHistory;
        localStorage.setItem('chatLogJSON', JSON.stringify(currentData));
    }


    function processAndDisplayChat(data) {
        characterNameHeader.textContent = data.characterName || '캐릭터';
        if (data.userPersona && data.userPersona.information && !localStorage.getItem('userPersona')) {
            userPersonaInput.value = data.userPersona.information;
        }
        if (data.messages && Array.isArray(data.messages)) {
            fullChatHistory = data.messages;
            displayChatHistory();
        }
    }

    function displayChatHistory() {
        chatLogContainer.innerHTML = '';
        fullChatHistory.forEach((message, index) => {
            appendBubble(message.content, message.role, index);
        });
        scrollToBottom();
    }

    function appendBubble(text, role, index) {
        const bubble = document.createElement('div');
        bubble.classList.add('chat-bubble');
        bubble.textContent = text;
        bubble.dataset.index = index; // 각 말풍선에 고유 인덱스 부여
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
    
    // 4. 채팅 메시지 전송 및 AI 응답 처리
    async function sendChatMessage() {
        if (isGenerating) return;
        const messageText = messageInput.value.trim();
        if (messageText === '') return;
        if (!apiKeyInput.value) {
            alert('설정에서 Gemini API 키를 먼저 입력해주세요.');
            return;
        }

        const userMessage = { role: 'user', content: messageText };
        fullChatHistory.push(userMessage);
        appendBubble(userMessage.content, userMessage.role, fullChatHistory.length - 1);
        updateStoredChatLog(); // 새 메시지 추가 후 저장
        messageInput.value = '';
        scrollToBottom();

        isGenerating = true;
        sendBtn.disabled = true;
        const thinkingBubbleIndex = fullChatHistory.length;
        appendBubble('입력 중...', 'assistant', thinkingBubbleIndex);
        scrollToBottom();

        const contextSize = parseInt(contextSizeInput.value, 10);
        const recentHistory = contextSize === 0 ? fullChatHistory : fullChatHistory.slice(-(contextSize + 1), -1); // '입력중' 제외
        
        // 3가지 프롬프트를 조합하여 최종 시스템 프롬프트 생성
        const finalSystemPrompt = `
[행동 규칙]
${systemPromptInput.value}

[캐릭터 설정]
${userPersonaInput.value}

[유저 노트]
${userNoteInput.value}

        `;
        
        const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModelInput.value}:generateContent?key=${apiKeyInput.value}`;

        try {
            const response = await fetch(apiURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "system_instruction": { "parts": [{ "text": finalSystemPrompt }] },
                    "contents": recentHistory.map(msg => ({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.content }]
                    }))
                })
            });

            document.querySelector(`[data-index='${thinkingBubbleIndex}']`).remove();

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.error.message);
            }

            const data = await response.json();
            const aiResponseText = data.candidates[0].content.parts[0].text;
            
            const aiMessage = { role: 'assistant', content: aiResponseText };
            fullChatHistory.push(aiMessage);
            appendBubble(aiMessage.content, aiMessage.role, fullChatHistory.length - 1);
            updateStoredChatLog(); // AI 응답 추가 후 저장

        } catch (error) {
            appendBubble(`API 오류: ${error.message}`, 'character', fullChatHistory.length);
        } finally {
            isGenerating = false;
            sendBtn.disabled = false;
            scrollToBottom();
        }
    }

    // 5. 수정/삭제 모달 관련 함수
    function showEditModal(index) {
        currentlyEditingIndex = index;
        modalTextarea.value = fullChatHistory[index].content;
        editModal.style.display = 'flex';
    }

    function hideEditModal() {
        editModal.style.display = 'none';
        currentlyEditingIndex = -1;
    }

    function saveEditedMessage() {
        if (currentlyEditingIndex > -1) {
            fullChatHistory[currentlyEditingIndex].content = modalTextarea.value;
            updateStoredChatLog(); // 수정 후 저장
            displayChatHistory(); // 전체 화면 다시 그리기
        }
        hideEditModal();
    }

    function deleteMessage() {
        if (currentlyEditingIndex > -1) {
            // "정말 삭제하시겠습니까?" 확인창
            if (confirm("이 메시지를 정말 삭제하시겠습니까?")) {
                fullChatHistory.splice(currentlyEditingIndex, 1);
                updateStoredChatLog(); // 삭제 후 저장
                displayChatHistory(); // 전체 화면 다시 그리기
            }
        }
        hideEditModal();
    }


    // 6. 이벤트 리스너 및 초기화
    appIcons.forEach(icon => icon.addEventListener('click', () => openApp(icon.dataset.app)));
    backButtons.forEach(button => button.addEventListener('click', goHome));
    saveSettingsBtn.addEventListener('click', saveSettings);
    jsonUploadInput.addEventListener('change', handleFileUpload);
    
    sendBtn.addEventListener('click', sendChatMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });

    // 말풍선 클릭 시 수정/삭제 모달 띄우기 (이벤트 위임)
    chatLogContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('chat-bubble')) {
            const index = parseInt(e.target.dataset.index, 10);
            showEditModal(index);
        }
    });

    modalSaveBtn.addEventListener('click', saveEditedMessage);
    modalDeleteBtn.addEventListener('click', deleteMessage);
    modalCancelBtn.addEventListener('click', hideEditModal);

    loadSettings();
    loadChatLogFromStorage();
});
