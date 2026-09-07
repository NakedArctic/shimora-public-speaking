# SHIMORA live payments

This site uses Razorpay hosted Payment Buttons. It works with the existing static hosting and does not need Vercel, a separate backend, or API keys.

## Verification status — 7 September 2026

All nine buttons are Active in the Razorpay Dashboard. Their public preference responses confirm live mode and the label **Pay Class Fees**. Razorpay marks `https://shimora.online` as verified. Website checks confirm all nine plan prices match their intended button IDs and all referenced assets exist.

Publication is pending: the embedded checkout shows **Some error occurred** in the in-app browser, including Razorpay's own official button tester. The underlying public preference requests succeed outside that browser. A checkout check in Chrome or Edge is still needed before replacing the existing published payment links. No real transaction has been performed.

## Live button catalogue

Each button is a fixed-price Quick-Pay button labelled **Pay Class Fees**, collecting Email, Phone and Student Name. All amounts are INR.

| Plan | Amount (INR) | Public button ID |
| --- | ---: | --- |
| Basic Starter | 2,000 | pl_TYqphzIT9y24JP |
| Basic Monthly | 5,000 | pl_TYqv1o7dh7IUQX |
| Standard 3 Months | 10,000 | pl_TZ0UvhEHMP9IF5 |
| Standard 4 Months | 15,000 | pl_TZ0Yf5XApIuhVq |
| Standard 5 Months | 20,000 | pl_TZ0dbKhOZ0HzMM |
| Standard 6 Months | 25,000 | pl_TZ0eTWtupmSJAz |
| Premium 8 Months | 30,000 | pl_TZ0fL3nD69HV8M |
| Premium 10 Months | 35,000 | pl_TZ0gFiiost0uAL |
| Premium 1 Year | 40,000 | pl_TZ6j3O1xXfhkNC |

Each payment is collected once. The Starter plan displays a weekly price; these buttons do not create recurring subscriptions. Class enrollment remains manual. Confirm the successful payment in the Razorpay Dashboard before arranging classes.

## Website files

- `index.html`: nine official Razorpay embeds, each within its matching plan card. The general Razorpay link scrolls to pricing.
- `tiers.css`: spacing for the payment buttons.
- `PAYMENT-SETUP.md`: this catalogue and maintenance guide.

## Check the setup

Open the website, choose a plan and click **Pay Class Fees**. Confirm the merchant and correct amount, then close the form without paying. Completing an actual payment transfers real money. No real payment has been made during setup.

After publishing, reload the website and confirm that all nine buttons appear. If a button stops loading, check that its status is Active in Razorpay and that the browser allows checkout.razorpay.com.

To change prices later, update the fixed price in the corresponding Razorpay button and the displayed website price together, then repeat the checkout check. Never paste API secrets or downloaded key files into this repository.
