**ctrl shift v to make the page render**

**Deadline for Submission:** 08 May 2026, Friday, 23:59 (to moodle)

**Team Size:** 3 or 4 from any section

**Demonstration (15 mins):** The team will demonstrate their project on a laptop at my office on 09th of May, Saturday. Any member who doesn't attend to the meeting will not be graded. The team should reserve an appropriate time slot from the course's Moodle page.

**Submission:** All project source codes, assets and database exports should be uploaded to Moodle by one of the team members by deadline (08th of May).

**Team work:** Each team member will be responsible for a specific part of the project. The team is required to use Git and GitHub for collaboration. Students are expected to learn these tools on their own. The GitHub repository will be reviewed during the demo to evaluate individual contributions and teamwork.

**Development Environment:** Teams are required to use Docker for services such as MySQL in order to maintain a consistent development environment.

# Sustainable Discount Marketplace

**Objective:** You will develop a multi-user, web-based application using Node.js, the Express framework, and MySQL. You are expected to design and implement your own user interface and database schema using HTML, CSS, JavaScript, and the DOM API. The use of third-party frontend frameworks/libraries (e.g., React, Vue, Angular) is not allowed. However, UI components for toast notifications, date pickers, modals, and simple search/table functionality may be used. You may also use any CSS framework (e.g., Bootstrap, Tailwind) if you wish.

**Problem:** The waste of expired products in markets poses a serious challenge in terms of efficient resource utilization. Many products are discarded before they are sold, resulting in financial losses for markets and unnecessary waste of valuable resources. This issue highlights the need for systems that can help reduce such waste.

**Solution:** An information system that enables the sale of products nearing their expiration date at discounted prices can help reduce waste. In this way, markets can reduce product loss, while consumers benefit from lower prices, creating a win-win situation for both parties.

**System Overview:** The system will have two types of users: market users and customers. Market users can add products nearing their expiration date to the system, including details such as the normal price, discounted price, and expiration date. Customers can search for products based on criteria such as district or product name and view nearby markets offering discounted items. They can also see how many days remain until a product's expiration date.

## Functional Requirements:

- There are two types of users in the system: consumer and market users.

- **Market User:**
  - A market can sign up for the system by providing the following information: email, market name, password, city, and district.
    Example:
    Email: "Tok-Market@gmail.com", Name: "Tok Market", Password: "1234",
    City: "Ankara", District: "Bilkent"
  - **(5Pts)** A market user can update/edit their own information.
  - **(10Pts)** A market user can add a new product nearing its expiration date to their inventory. A product is defined by the following fields: title, stock, normal price, discounted price, expiration date, and an image.
    Example: "Toblerone 100gr", 25 pieces, 200 TL, 120 TL, 22-05-2026, and the product image.
  - **(5Pts)** A market user can edit and delete a product (including updating the product image).
  - **(5Pts)** When a market user logs in, all expired products in the list should be clearly marked, so that the user is aware of products that have passed their expiration date.

- **Consumer User:**
  - A consumer can sign up for the system by providing their email address, full name, city, and district.
  - **(5Pts)** A consumer can update/edit their own information.
  - **(10Pts)** A consumer can search for products using keywords (search bar). The system should return all products that match the keyword either exactly or partially.
    For example, searching for the keyword "mag" should return products such as "magnum", "magnolia-cake", "nutmeg", etc.
    The results should include only products in the same city as the consumer and give priority to products in the same district. Expired products must not be included in the results. The results should be paginated with a page size of 4 products.
  - **(5Pts)** A consumer can add products to a shopping cart. The shopping cart must be stored in the database and persist between user sessions.
  - **(10Pts)** In the shopping cart, the consumer can update the cart (e.g., remove items or change quantities), and the system should display the grand total. AJAX must be used for this functionality.
  - **(5Pts)** The shopping cart page must include a "Purchase" button. When clicked, it should clear the cart and remove the purchased products from the system. AJAX must be used for this functionality.

- **(15Pts) Registration:** The system should support registration for both Market and Consumer users using email addresses. The provided email address must be verified using a confirmation code (e.g., a 6-digit random number) sent via email. Students are expected to research and implement the required email functionality on their own. For example, libraries such as Nodemailer may be used.

- **(5Pts) Login:** Users can log into the system using their email address and password. The system should display an error message if authentication fails. Passwords must be stored in a hashed form.

## Non-Functional Requirements:

- **(5Pts)** All forms must be validated and should support sticky-form functionality to improve usability.
- **(15Pts)** The system must provide a clear, consistent, and user-friendly interface.
- The system should include a sufficient amount of meaningful data for demonstration purposes. Unrealistic or placeholder test data should be avoided.
- The requirements provide an overall description of the application. Therefore, you are encouraged to use your own initiative to handle any missing details.
- Cheating is strictly prohibited. Otherwise, all team members will receive a grade of zero.
- You are expected to provide clear answers to questions based on the source code.
- During the demonstration, I will ask questions to all team members about the project. Your grade will be based on your answers and your individual contribution to the project.
- A penalty of 20 points will be applied for late submissions. The deadline is May 08, 23:59.
- A penalty of 20 points will be applied if you don't use git/github and docker.