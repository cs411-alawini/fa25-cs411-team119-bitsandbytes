# Project Proposal
## Name: CS Degree Planner 
### Project Summary
UIUC students currently have three separate tools to plan their semester plans: course audit to view remaining requirements, course explorer to view prerequisites, and GPA disparity visualizations to gauge difficulty of planned courses. Our project is a web application that allows students to visualize their pending degree requirements, explore options to fulfill them with filters for GPA and their completed prerequisites, and build semester plans that continuously update prerequisite data. When a student adds a course to their plan, the system will automatically recalculate eligibility for dependent courses, flagging ones that cannot yet be taken and showing the earliest semester they become available, so students always know when they can schedule their desired courses.
This platform eliminates the need to interact with all three tools and instead helps students build the best plan to complete their degree requirements. Since it is not feasible to build this application across all majors due to limited data availability, this application will only cover all CS and CS+X majors. 

### Creative Component
The creative component will be allowing users to filter courses that meet a degree requirement by whether or not they have completed/planned for its prerequisites and for them to view based on that information what semester they would be eligible to take the course. 
This is technically challenging as prerequisite data is not nicely stored in any preexisting dataset. Instead, to get access to this information we must:

1. **Use Text Parsing** – The course catalog data (see realness section) has a column labeled as section info. This contains strings that use key phrases such as "Prerequisites" and “Concurrent Enrollment” followed by course codes. We will need to extract this data by recognizing the prefixes following the course codes we want to pull for each course. 
2. **Storing dependency information** - Once a user selects that they have taken a certain course or plan to, we will need to store this information in a way that allows us for each course to determine whether the user is eligible to take it based on current planning and what semester they are eligible. 

This feature, while technically challenging, creates user value as users do not have to reference outside sources to gauge course eligibility before adding it to their semester plans. 

### Usefulness
The web app has the following functionality:
Students can…
* track major requirements completion.
* find courses that meet their incomplete requirements. 
* view and filter courses by their completed and planned prerequisites to see if and when it is possible to take a course. 
* view and filter courses by their overall GPAs and teacher specific GPAs. 
* generate semester by semester degree plans based on the previous courses they took and prerequisites for their future courses. 

**Similar applications**:
* University degree audit
  * Does
    * Shows completed and pending requirements
  * Does not 
    * Provide prerequisites list
    * Contain information on course difficulty, does not let
    * Allows students to directly form semester plans 
* WAF GPA visualizations
  * Does
    * Provides historical GPAs for courses broken down by teacher
  * Does not 
    * Allow users to interact data with their course requirements
* Course Explorer
  * Does 
    * View courses fulfilling genEDs
    * View prerequisites 
  * Does not
    * View courses fulfilling major specific requirements
    * View course difficulty 
    * Create semester plans 

**Our difference**:
Our app recognizes that students are often interacting with all three of the above tools, along with a separate semester planning document like a spreadsheet, when determining course plans. We consolidate the 4 functionalities provided by these separate tools into one comprehensive system, a highly useful tool for students struggling to juggle all the factors that play into course planning. 

### Realness – Datasets
We will use the following datasets:

1. Course Catalog Data (https://github.com/wadefagen/datasets/tree/main/course-catalog): his will provide us a list of all the courses in UIUC. Under the section info tab, information about prerequisites and concurrent enrollment is given. By parsing that string, we can store the prerequisite and concurrent enrollment information for each course. Additionally, this provides us with credit hour information to ensure students align with the 12-18 credit hour range. 
  a. Data Type: CSV file 
  b. Number of Rows: 12322
  c. Number of Columns: 26

2. Gened Dataset (https://github.com/wadefagen/datasets/tree/main/geneds): This dataset will map each course to what GenED it satisfies. This will simplify the logic for GenED requirements for each major, as this data is nicely stored in a preexisting csv.
  a. Data Type: CSV file 
  b. Number of Rows: 1061
  c. Number of Columns: 11

3. GPA Dataset: This dataset hosts the gpa averages for each course across previous semesters, broken down by teacher. 
  a. Data Type: CSV file 
  b. Number of Rows: 74600
  c. Number of Columns: 23



