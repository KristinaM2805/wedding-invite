// ===== НАСТРОЙКА GOOGLE TABLES =====
// Вставьте сюда URL из Google Apps Script (тот, что скопировали при развертывании)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwELBdkVoYW2on27xpLaOV-1PU0dBnQ_modEK7RjWT3A5zF8wx5M4Nhs0K8WNPf7Aqq/exec';

// ===== КОД ФОРМЫ =====
const form = document.getElementById('guestForm');
const statusDiv = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

function getSelectedDrinks() {
    const checkboxes = document.querySelectorAll('.drink-options input[type="checkbox"]');
    let selected = [];
    checkboxes.forEach(cb => {
        if (cb.checked) selected.push(cb.value);
    });
    return selected.length ? selected.join(', ') : 'Не указано';
}

function saveToLocalStorage(data) {
    let saved = localStorage.getItem('wedding_guests');
    let guests = saved ? JSON.parse(saved) : [];
    guests.push(data);
    localStorage.setItem('wedding_guests', JSON.stringify(guests));
}

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fullname = document.getElementById('fullname').value.trim();
    if (!fullname) {
        statusDiv.innerHTML = '<div class="error-msg">Пожалуйста, укажите ваше ФИО 💌</div>';
        return;
    }

    let attendanceValue = null;
    const radios = document.querySelectorAll('input[name="attendance"]');
    for (let radio of radios) {
        if (radio.checked) {
            attendanceValue = radio.value;
            break;
        }
    }
    if (!attendanceValue) {
        statusDiv.innerHTML = '<div class="error-msg">Подтвердите, пожалуйста, сможете ли вы быть ❤️</div>';
        return;
    }

    const drinks = getSelectedDrinks();
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляем...';
    
    const formData = {
        fullname: fullname,
        attendance: attendanceValue,
        drinks: drinks,
        timestamp: new Date().toLocaleString('ru-RU')
    };
    
    try {
        // Отправка в Google Таблицы через Apps Script
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Важно для работы с Google Scripts
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        // Сохраняем в localStorage как резервную копию
        saveToLocalStorage(formData);
        
        const successMessage = attendanceValue === 'Приду с радостью!' 
            ? `🎉 Спасибо, ${fullname}! Ждём вас на празднике! Любимые напитки: ${drinks}. Мы учтём ❤️`
            : `💔 Очень жаль, ${fullname}, что не сможете быть. Но будем на связи! Спасибо за ответ.`;
        
        statusDiv.innerHTML = `<div class="success-msg">${successMessage}<br><span style="font-size:0.8rem;">✅ Ответ сохранён в Google Таблице организаторов</span></div>`;
        form.reset();
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        statusDiv.innerHTML = '<div class="error-msg">❌ Ошибка отправки. Пожалуйста, попробуйте ещё раз или напишите в Telegram-чат.</div>';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить ответ';
    }
});

// Открытие карты
document.getElementById('openMap')?.addEventListener('click', function(e) {
    e.preventDefault();
    const address = encodeURIComponent('Беларусь, Гродно, усадьба Радзивилки');
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
});

// Показываем, если гость уже отвечал раньше (опционально)
function checkPreviousResponse() {
    const saved = localStorage.getItem('wedding_guests');
    if (saved) {
        const guests = JSON.parse(saved);
        const lastGuest = guests[guests.length - 1];
        if (lastGuest && lastGuest.fullname) {
            console.log('Предыдущий гость:', lastGuest.fullname);
        }
    }
}
checkPreviousResponse();