//--------------carrosel de comentarios-------------------\\
const reviews = document.querySelectorAll('.review-slider .box');
const prevReview = document.querySelector('.prev-review');
const nextReview = document.querySelector('.next-review');

let currentReview = 0;

function showReview(index) {

    if (reviews.length === 0) return;
    reviews.forEach(review => {
        review.classList.remove('active');
    });
    reviews[index].classList.add('active');
}

if (nextReview) {
    nextReview.addEventListener('click', () => {
        currentReview++;
        if (currentReview >= reviews.length) {
            currentReview = 0;
        }

        showReview(currentReview);
    });
}

if (prevReview) {
    prevReview.addEventListener('click', () => {
        currentReview--;
        if (currentReview < 0) {
            currentReview = reviews.length - 1;
        }

        showReview(currentReview);
    });
}

// Troca automática a cada 3 segundos
if (reviews.length > 0) {
    showReview(currentReview);
    setInterval(() => {
        currentReview++;
        if (currentReview >= reviews.length) {
            currentReview = 0;
        }

        showReview(currentReview);
    }, 3000);
}
