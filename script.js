// DOM(Document Object Model)이 모두 로드된 후에 스크립트를 실행합니다.
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. 필요한 HTML 요소들 가져오기 ---
    const appIcons = document.querySelectorAll('.app-icon');
    const appViews = document.querySelectorAll('.app-view');
    const backButtons = document.querySelectorAll('.back-btn');
    const homeScreen = document.getElementById('home-screen');

    const apiKeyInput = document.getElementById('api-key');
    const userPersonaInput = document.getElementById('user-persona');
    const userNoteInput = document.getElementById('user-note');
    const geminiModelInput = document.getElementById('gemini-model');
    const jsonUploadInput = document.getElementById('json-upload');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    // 각 앱의 콘텐츠 영역
    const callLogList = document.getElementById('call-log-list');
    const messageList = document.getElementById('message-list');
    const chatLogContainer = document.querySelector('#charactalk-app .chat-log');
    const characterNameHeader = document.querySelector('#charactalk-app .character-name');

    let chatLogData = null;


    // --- 2. 핵심 기능 함수 (화면 전환, 설정 저장/불러오기) ---

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
        if (chatLogData) {
            localStorage.setItem('chatLogJSON', JSON.stringify(chatLogData));
            alert('설정 및 채팅 로그가 저장되었습니다!');
        } else {
            alert('설정이 저장되었습니다!');
        }
    }

    function loadSettings() {
        apiKeyInput.value = localStorage.getItem('geminiApiKey') || '';
        geminiModelInput.value = localStorage.getItem('geminiModel') || 'gemini-1.5-flash-latest';
        userPersonaInput.value = localStorage.getItem('userPersona') || '';
        userNoteInput.value = localStorage.getItem('userNote') || '';
    }

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonString = e.target.result;
                chatLogData = JSON.parse(jsonString);
                localStorage.setItem('chatLogJSON', jsonString);
                alert(`${file.name} 파일이 성공적으로 주입 및 저장되었습니다.\nAI 분류를 시작합니다.`);
                classifyAndDisplayLogs(); // << 파일 업로드 후 바로 분류 시작
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
                chatLogData = JSON.parse(savedJSONString);
                console.log('로컬 스토리지에서 채팅 로그를 불러왔습니다.');
                classifyAndDisplayLogs(); // << 페이지 로드 시 바로 분류 시작
            } catch (error) {
                console.error('로컬 스토리지 JSON 파싱 오류:', error);
            }
        }
    }


    // --- 3. AI 분류 및 화면 표시 기능 (이번 단계의 핵심) ---

    /**
     * Gemini API를 호출하여 대화의 종류를 분류하는 함수
     * @param {object} conversationLog - 분류할 대화 로그 객체
     * @returns {Promise<string>} - 분류 결과 ('전화', '문자', '카톡' 등)
     */
    async function callGeminiForClassification(conversationLog) {
        const apiKey = apiKeyInput.value;
        const model = geminiModelInput.value;
        // API 엔드포인트 URL (모델명과 API 키를 포함)
        const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        // AI에게 내릴 지시사항 (프롬프트)
        const prompt = `
            당신은 대화 내용 분석 전문가입니다. 다음 대화 로그를 읽고, 대화의 성격이 '전화', '문자', '카톡' 중 무엇에 가장 가까운지 판단하여 오직 한 단어로만 대답해주세요.
            - 전화: "여보세요", "끊을게" 등의 명확한 통화 용어가 있거나, 격식 있는 용건 전달 위주의 대화.
            - 문자: 매우 짧고 간결하게 한두 마디만 주고받는 대화.
            - 카톡: 친구와 수다떠는 듯한 일상 대화, 이모티콘이나 웃음 표현이 잦은 대화.
            ---
            [대화 내용]
            ${JSON.stringify(conversationLog)}
        `;

        try {
            // fetch API를 사용해 Gemini API에 요청을 보냄
            const response = await fetch(apiURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) { // 응답이 성공적이지 않으면
                const errorBody = await response.json();
                throw new Error(`API 오류: ${errorBody.error.message}`);
            }

            const data = await response.json();
            // API 응답에서 텍스트 부분만 추출하여 반환
            const result = data.candidates[0].content.parts[0].text.trim();
            console.log("AI 분류 결과:", result);
            return result;

        } catch (error) {
            console.error("Gemini API 호출 중 오류 발생:", error);
            // 오류 발생 시 '카톡'으로 기본 처리하여 앱이 멈추지 않도록 함
            return '카톡'; 
        }
    }

    /**
     * chatLogData를 순회하며 AI로 분류하고, 결과를 각 앱 화면에 표시하는 메인 함수
     */
    async function classifyAndDisplayLogs() {
        if (!chatLogData || !chatLogData.conversations) {
            console.log("분류할 채팅 데이터가 없습니다.");
            return;
        }
        if (!apiKeyInput.value) {
            alert('설정에서 Gemini API 키를 먼저 입력해주세요.');
            goHome();
            openApp('settings');
            return;
        }
        
        // 캐릭터톡 헤더에 캐릭터 이름 설정 (JSON 데이터에 persona 이름이 있다고 가정)
        if(chatLogData.userPersona) {
            characterNameHeader.textContent = chatLogData.userPersona;
        }

        // 분류 시작 전, 기존 목록 비우기
        callLogList.innerHTML = '<p>AI가 통화 기록을 분류하는 중...</p>';
        messageList.innerHTML = '<p>AI가 문자 내역을 분류하는 중...</p>';
        chatLogContainer.innerHTML = ''; // 카톡은 일단 비워둠

        // 분류된 데이터를 담을 배열
        const phoneLogs = [];
        const messageLogs = [];
        const charactalkLogs = [];

        // 모든 대화 묶음에 대해 AI 분류를 요청 (병렬 처리를 위해 Promise.all 사용)
        const classificationPromises = chatLogData.conversations.map(async (conv) => {
            const type = await callGeminiForClassification(conv.log);
            if (type.includes('전화')) {
                phoneLogs.push(conv);
            } else if (type.includes('문자')) {
                messageLogs.push(conv);
            } else { // '카톡' 또는 그 외 모든 경우
                charactalkLogs.push(conv);
            }
        });

        // 모든 분류 작업이 끝날 때까지 기다림
        await Promise.all(classificationPromises);
        console.log("모든 대화 분류 완료!");

        // 분류된 결과를 각 앱 화면에 표시하는 함수들 호출
        displayLogs(phoneLogs, callLogList, '📞 통화');
        displayLogs(messageLogs, messageList, '💬 문자');
        displayCharactalk(charactalkLogs);
    }
    
    /**
     * 전화/문자 기록을 화면에 표시하는 함수
     * @param {Array} logs - 표시할 로그 데이터 배열
     * @param {HTMLElement} container - 로그를 표시할 HTML 요소
     * @param {string} prefix - 로그 앞에 붙일 아이콘 (📞 or 💬)
     */
    function displayLogs(logs, container, prefix) {
        container.innerHTML = ''; // 기존 내용 비우기
        if (logs.length === 0) {
            container.innerHTML = `<p>${prefix} 기록이 없습니다.</p>`;
            return;
        }
        logs.forEach(conv => {
            const logItem = document.createElement('div');
            logItem.className = 'log-item'; // CSS 스타일링을 위한 클래스
            // 내용의 첫 부분을 미리보기로 보여줌
            const previewText = conv.log[0]?.content || '내용 없음';
            logItem.textContent = `${prefix} | ${chatLogData.userPersona || '캐릭터'} | ${previewText.substring(0, 15)}...`;
            container.appendChild(logItem);
            // TODO: 나중에 이 아이템을 클릭하면 상세 대화 내용을 보여주는 기능 추가
        });
    }

    /**
     * 캐릭터톡 대화 내용을 화면에 표시하는 함수
     * @param {Array} logs - 표시할 카톡 로그 데이터 배열
     */
    function displayCharactalk(logs) {
        chatLogContainer.innerHTML = '';
        logs.forEach(conv => {
            conv.log.forEach(message => {
                const bubble = document.createElement('div');
                bubble.classList.add('chat-bubble');
                bubble.textContent = message.content;
                // role에 따라 말풍선 클래스(user/character)와 위치 결정
                if (message.role === 'user') {
                    bubble.classList.add('user');
                } else {
                    // assistant, model 등 user가 아닌 모든 경우를 캐릭터로 취급
                    bubble.classList.add('character'); 
                }
                chatLogContainer.appendChild(bubble);
            });
        });
        // 스크롤을 가장 아래로 내림
        chatLogContainer.scrollTop = chatLogContainer.scrollHeight;
    }


    // --- 4. 이벤트 리스너 및 초기화 ---

    appIcons.forEach(icon => {
        icon.addEventListener('click', () => openApp(icon.dataset.app));
    });
    backButtons.forEach(button => {
        button.addEventListener('click', goHome);
    });
    saveSettingsBtn.addEventListener('click', saveSettings);
    jsonUploadInput.addEventListener('change', handleFileUpload);

    loadSettings();
    loadChatLogFromStorage(); // 페이지 시작 시 자동으로 분류 시작!

});
