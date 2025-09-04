import { navigate } from "../main.js";
export async function navBar() {
    // Verification de connexion
    let isLogin = false;
    const res = await fetch('/api/me', { credentials: 'include' });
    if (res.ok)
        isLogin = true;
    const nav = document.createElement('nav');
    nav.innerHTML = `
        <nav class="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 bg-pink-200 shadow-md">
  <!-- Logo géant -->
  <div class="-my-4">
    <a href="/" class="block">
      <img src="/images/logo.png" alt="Logo" class="h-32 w-auto">
    </a>
  </div>

  <!-- Animation Ping-Pong Pixel -->
  <div class="flex-1 mx-10 relative h-12 overflow-hidden">
    <!-- Ligne centrale -->
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="h-full w-1 bg-purple-300/50"></div>
    </div>
    
    <!-- Raquette GAUCHE -->
    <div class="absolute left-0 top-1/2 transform -translate-y-1/2 ping-pong-paddle-left">
      <div class="relative" style="width: 16px; height: 32px;">
        <div class="absolute" style="
          width: 4px; height: 32px;
          background: #FF9FF3;
          left: 0;
          box-shadow: 4px 0 0 #FF9FF3,
                      8px 0 0 #FF9FF3,
                      12px 0 0 #FF9FF3;">
        </div>
        <div class="absolute" style="
          width: 16px; height: 8px;
          background: #FECA57;
          top: 12px;
          box-shadow: 0 8px 0 #FECA57;">
        </div>
      </div>
    </div>
    
    <!-- Raquette DROITE -->
    <div class="absolute right-0 top-1/2 transform -translate-y-1/2 ping-pong-paddle-right">
      <div class="relative" style="width: 16px; height: 32px;">
        <div class="absolute" style="
          width: 4px; height: 32px;
          background: #54A0FF;
          right: 0;
          box-shadow: -4px 0 0 #54A0FF,
                      -8px 0 0 #54A0FF,
                      -12px 0 0 #54A0FF;">
        </div>
        <div class="absolute" style="
          width: 16px; height: 8px;
          background: #00D2D3;
          top: 12px;
          box-shadow: 0 8px 0 #00D2D3;">
        </div>
      </div>
    </div>
    
    <!-- Balle -->
    <div class="absolute top-1/2 left-1/2 ping-pong-ball">
      <div style="
        width: 8px; height: 8px;
        background: #FECA57;
        box-shadow: 8px 0 0 #FECA57,
                    0 8px 0 #FECA57,
                    8px 8px 0 #FECA57;">
      </div>
    </div>
  </div>

  <!-- Boutons + Sélecteur de langue -->
  <div class="flex items-center space-x-6 mr-6">
    <a href="/" 
       class="relative px-4 py-2 bg-pink-200 border-2 border-t-white border-l-white border-r-pink-400 border-b-pink-400 
             text-blue-300 font-bold
             shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
             active:shadow-none active:translate-y-[2px] active:border-pink-300
             transition-all duration-100">
      Home
    </a>
    <a href="/chat" 
       class="relative px-4 py-2 bg-pink-200 border-2 border-t-white border-l-white border-r-pink-400 border-b-pink-400 
             text-blue-300 font-bold
             shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
             active:shadow-none active:translate-y-[2px] active:border-pink-300
             transition-all duration-100">
      Chat
    </a>
    <a href="/profil" 
       class="relative px-4 py-2 bg-pink-200 border-2 border-t-white border-l-white border-r-pink-400 border-b-pink-400 
             text-blue-300 font-bold
             shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
             active:shadow-none active:translate-y-[2px] active:border-pink-300
             transition-all duration-100">
      Profile
    </a>
    ${isLogin
        ? `<a href="/logout" id="logout-btn" 
           class="relative px-4 py-2 bg-pink-200 border-2 border-t-white border-l-white border-r-pink-400 border-b-pink-400 
                 text-blue-300 font-bold
                 shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                 active:shadow-none active:translate-y-[2px] active:border-pink-300
                 transition-all duration-100">
            Logout
         </a>`
        : `<a href="/auth" 
           class="relative px-4 py-2 bg-pink-200 border-2 border-t-white border-l-white border-r-pink-400 border-b-pink-400 
                 text-blue-300 font-bold
                 shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                 active:shadow-none active:translate-y-[2px] active:border-pink-300
                 transition-all duration-100">
            Login
         </a>`}

    <!-- Sélecteur de langue -->
   <!-- Language Selector -->
<div class="relative">
  <select id="language-select" 
          class="relative px-4 py-2 bg-pink-200 border-2 border-t-white border-l-white 
                 border-r-pink-400 border-b-pink-400 text-blue-300 font-bold
                 shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                 active:shadow-none active:translate-y-[2px] active:border-pink-300
                 transition-all duration-100 appearance-none pr-8">
    <option value="fr" selected>🇫🇷 Français</option>
    <option value="en">🇬🇧 English</option>
    <option value="es">🇪🇸 Español</option>
  </select>
  <!-- Little dropdown arrow -->
  <span class="pointer-events-none absolute inset-y-0 right-2 flex items-center text-blue-300">
    ▼
  </span>
</div>
  </div>

  <style>
    /* Animations */
    .ping-pong-ball {
      animation: pingpong 3s linear infinite;
      transform: translate(-50%, -50%);
    }
    @keyframes pingpong {
      0% { left: 20%; top: 50%; }
      25% { left: 50%; top: 30%; }
      50% { left: 80%; top: 50%; }
      75% { left: 50%; top: 70%; }
      100% { left: 20%; top: 50%; }
    }
    .ping-pong-paddle-left {
      animation: paddleLeft 3s ease-in-out infinite;
    }
    .ping-pong-paddle-right {
      animation: paddleRight 3s ease-in-out infinite;
    }
    @keyframes paddleLeft {
      0%, 100% { transform: translateY(-50%); }
      25% { transform: translateY(-30%); }
      75% { transform: translateY(-70%); }
    }
    @keyframes paddleRight {
      0%, 100% { transform: translateY(-50%); }
      50% { transform: translateY(-30%); }
    }
  </style>
</nav>
    `;
    if (isLogin) {
        const logoutBtn = nav.querySelector('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await fetch('/logout', {
                    method: 'POST',
                    credentials: 'include',
                });
                navigate('/');
            });
        }
    }
    return nav;
}
