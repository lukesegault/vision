/* Contact details are stored scrambled (reversed, then base64, then split in
   pieces) so that no email address or phone number appears as plain text in
   the page, the JavaScript or the repository. They are only put back together
   in the browser, when a visitor asks to see them.

   This stops the common bots that read a page's source for anything shaped
   like an email or a phone number. It does not stop a determined person or a
   bot that runs the page and clicks the button. To scramble a new value, run
   `npm run scramble -- "the text"` and paste the result into src/data/about.js. */
export const unscramble = (parts) => atob(parts.join('')).split('').reverse().join('');
