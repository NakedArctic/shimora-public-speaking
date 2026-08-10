const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('nav');
menuButton.addEventListener('click', () => {
  const isOpen = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', isOpen);
});
document.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => navigation.classList.remove('open')));
document.querySelector('#enquiry-form').addEventListener('submit', event => {
  event.preventDefault();
  event.currentTarget.querySelector('.form-message').textContent = 'Thank you! Your enquiry is ready to send. Connect this form to your email or booking tool before publishing.';
  event.currentTarget.reset();
});
document.querySelector('.upi').addEventListener('click', event => {
  const button = event.currentTarget;
  navigator.clipboard.writeText(button.dataset.upi).then(() => {
    button.querySelector('small').textContent = `UPI ID copied: ${button.dataset.upi}`;
  });
});
const weeklyBasicPlan = document.querySelector('.basic-tier .tier-plan');
weeklyBasicPlan.querySelector('strong').innerHTML = '₹2,000 <small>/ week</small>';
weeklyBasicPlan.querySelector('p').textContent = '3 sessions per month';
document.querySelector('.paypal').remove();
