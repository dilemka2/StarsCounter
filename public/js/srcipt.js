// making warning/result
let progressLine = document.querySelector('.progress-line');
let progress = document.querySelector('.progress');
let warningBlock = document.querySelector('#warningBlock-wrapper')

let resultBlock = document.querySelector('#resultBlock-wrapper');
let resultBlockIn = document.querySelector('.resultBlock')
let resultImg = document.querySelector('.result-img');
let resultH2 = document.querySelector('.ResultH2');
document.querySelector('#close').addEventListener('click', () =>{
    warningBlock.style.display = 'none';
    progress.style.width = '100%';
}) ;

function progressUpdating() {
    let amount = 100;
    progress.style.display = 'block';
    progress.style.width = amount + '%';
    let interval = setInterval(() => {
        if (amount == 0) {
            warningBlock.style.display = 'none';
            clearInterval(interval);
        }
        else {
            amount = amount - 10;
            progress.style.width = amount + '%';
        }
    }, 300)
}


document.getElementById('form').addEventListener('submit', async(e) => {
    e.preventDefault();
    const file = document.getElementById('input').files[0];
    if (!file) {
        warningBlock.style.display = 'flex';
        progressUpdating();
        return;
    }
    const formData = new FormData();
    formData.append('photo', file);

    try {
        const response = await fetch('http://localhost:3030/send-photo', {
            method: 'POST',
            body:formData,
        })

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`)
        }
        const result = await response.json();

        if (result) {
            resultBlock.style.display = 'flex';
            progress.style.display = 'none';
            resultImg.src = `/uploads/${result.greyImagePath}`;

            resultH2.innerText = `Успішно було знайдено ${result.whiteObjectsCount} зірки!`;
            let closeBTN = document.createElement('button');
            resultBlockIn.appendChild(closeBTN);
            closeBTN.innerHTML = `<i class='bx bx-x' style='color:#ffffff' ></i>`
            closeBTN.classList.add('btn');
            closeBTN.onclick = () => {resultBlock.style.display='none';closeBTN.remove()};
        }
    }

    catch(e) {
        console.log(e);
    }
})

document.getElementById('profile-form').addEventListener('submit', async(e) => {
    e.preventDefault();
    const profilePic = document.getElementById('input-profile').files[0];
    const profileDesc = document.getElementById('describsion').value;
    
    if(!profilePic) {
        alert('ви не загрузили файл');
        return;
    }
    const formData = new FormData();
    formData.append('inputProfile', profilePic);
    formData.append('describsion', profileDesc);
    
    try {
        const responseP = await fetch('http://localhost:3030/profile-update', {
            method: 'POST',
            body: formData,
        });

        if (!responseP.ok) {
            throw new Error(`Server error: ${response.statusText}`)
        }
    }   

    catch(e) {
        console.log(e);
    }
})