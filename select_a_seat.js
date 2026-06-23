const seats = document.querySelectorAll('.seat:not(.occupied)');
const selectedSeatText = document.getElementById('selected-seat');
const continueBtn = document.querySelector('.continue-btn');

continueBtn.disabled = true;

seats.forEach(seat => {

    seat.addEventListener('click', () => {

        document
            .querySelectorAll('.seat.selected')
            .forEach(s => s.classList.remove('selected'));

        seat.classList.add('selected');

        selectedSeatText.textContent = seat.textContent;

        continueBtn.disabled = false;

    });

});
continueBtn.addEventListener('click', () => {

    const selectedSeat =
        document.querySelector('.seat.selected');

    if(!selectedSeat){
        alert('Please select a seat');
        return;
    }

    window.location.href = 'passenger-details.html';

});