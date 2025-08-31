// DOM(Document Object Model)이 모두 로드된 후에 스크립트를 실행합니다.
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. 필요한 HTML 요소들 가져오기 ---
    const appIcons = document.querySelectorAll('.app-icon');
    const appViews = document.querySelectorAll('.app-view');
    const backButtons = document.querySelectorAll('.back-btn');
    const homeScreen = document.getElementById('home-screen');

    // --- 2. 핵심 기능 함수 ---

    /**
     * 특정 앱을 화면에 보여주는 함수
     * @param {string} appId - 보여줄 앱의 ID (html의 data-app 속성값)
     */
    function openApp(appId) {
        // 홈 화면을 포함한 모든 앱 화면을 일단 숨김 처리
        appViews.forEach(view => {
            view.classList.remove('active');
        });
        
        // 클릭한 아이콘에 해당하는 앱 화면을 찾아서 'active' 클래스를 추가해 보여줌
        const targetApp = document.querySelector(`.app-view[data-app-id="${appId}"]`);
        if (targetApp) {
            targetApp.classList.add('active');
        }
    }

    /**
     * 홈 화면으로 돌아가는 함수
     */
    function goHome() {
        // 모든 앱 화면을 숨김 처리
        appViews.forEach(view => {
            view.classList.remove('active');
        });
        
        // 홈 화면에 'active' 클래스를 추가해 보여줌
        homeScreen.classList.add('active');
    }


    // --- 3. 이벤트 리스너(Event Listeners) 설정 ---

    // 각 앱 아이콘에 클릭 이벤트 추가
    appIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            // 아이콘이 가지고 있는 data-app 속성값을 가져옴
            const appId = icon.dataset.app; 
            openApp(appId);
        });
    });

    // 각 '홈' 버튼에 클릭 이벤트 추가
    backButtons.forEach(button => {
        button.addEventListener('click', goHome);
    });


    // --- 4. 앞으로 구현될 기능들을 위한 준비 공간 ---

    // TODO: (1) 시작 시 JSON 파일 로딩 및 AI 분류 기능 실행
    //   - 사용자가 설정에서 JSON 파일을 업로드하면, 이 파일을 읽어옵니다.
    //   - 읽어온 데이터를 기반으로 Gemini API에 "이 대화는 전화/문자/카톡 중 뭐야?"라고 물어봅니다.
    //   - API의 답변에 따라 데이터를 각 앱의 목록에 맞게 재정렬합니다.
    //   - 재정렬된 데이터를 화면에 표시합니다. (예: 전화 앱 목록 업데이트)

    // TODO: (2) 설정 저장 및 불러오기 기능
    //   - '저장하기' 버튼을 누르면 API 키 등의 정보를 브라우저의 '로컬 스토리지'에 저장합니다.
    //   - 페이지가 로드될 때 로컬 스토리지에서 저장된 값을 불러와 입력창에 미리 채워줍니다.

    // TODO: (3) 캐릭터톡 채팅 기능 구현
    //   - '전송' 버튼을 누르거나 엔터 키를 입력했을 때의 동작을 정의합니다.
    //   - 사용자의 메시지를 화면에 표시합니다.
    //   - 대화 기록, 프롬프트, 새 메시지를 조합하여 Gemini API에 요청을 보냅니다.
    //   - API로부터 받은 답변을 캐릭터의 말풍선으로 화면에 표시합니다.

});
