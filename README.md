# dog-tracker
GoogleScript/GoogleSpreadsheet-based Slack app for tracking which dogs are in your office today.
Reduces the need for people to ask around if a particular dog is in the office for them to visit.

When someone brings their dog in for the day they would use `/dog [their dog's name]`.
Slack then sends a notification to the desired channel to inform everyone that the dog is in the office.
Throughout the day other Slack users would use `/dog` to get a list of all the dogs currently in the office that day.

When a dog is registered as in-office, they will only show up as in-office for that day. If someone brings in their
dog again the next day, they're expected to run `/dog [their dog's name]` again.

## Data Flow
- Slack command sends POST requests to Google Script.
- Google Script uses Google Spreadsheet to manage the data.
  - Each row of the sheet contains dog name & last in-office date.
  - When a dog is marked in-office, its last in-office date is updated to today's date.
  - When the `/dog` command is issued, the script looks for all dogs that have a last in-office date of today and returns.
  - There are also commands to list all the dogs registered at the company, help, and 'delete' a dog from the registry.
- An Incoming Webhook is invoked to notify a Slack channel when a dog is marked as in-office.

## Slackbot Commands
- Assuming you've set the slack command to `/dog`:
  - `/dog help` -> List the commands with a description of what they do.
  - `/dog` -> List all the dogs in the office today.
  - `/dog list` -> List the dogs registered at your company.
  - `/dog register` -> [Dog Name] - Registers the given dog (example: /dog register bruno).
  - `/dog delete [Dog Name]` -> Deletes the given dog (example: /dog delete bruno).
  - `/dog [Dog Name]` -> Sets the given dog as in-office for the day (example: /dog bruno). If the dog is not registered, it will be.

## Prerequisites
- Admin access to your organization's Slack
- A Google account with Google Docs access

## Getting Started

### Google
- Create a new empty spreadsheet
- Go into `Tools` -> `Script Editor`
- Copy `dogTracker.gs` into the script
- Replace `[SPREADSHEET_ID]` with the ID of the spreadsheet from the spreadsheet's URL
  - As of writing, URL is like: `https://docs.google.com/spreadsheets/d/[ID]/edit#gid=0`
- Go to `Publish` -> `Deploy as Web app`
- Under `Who has access to this app` make sure the value is `Anyone, even anonymous`
  - *Important* Make sure you save the URL that it generates

### Slack
- Go to your apps management for slack
  - https://[ORGANIZATION_NAME].slack.com/apps

#### Incoming Webhook
- Go into `Manage` -> `Incoming Webhooks` -> `Add configuration`
- Choose the channel that you want to post to and click through
- Copy the `Webhook URL` and replace `[INCOMING_WEBHOOK_URL]` in your Google script
- Don't forget to modify the `Customize Name` and `Customize Icon` values :)

#### Slack command
- Go into `Manage` -> `Slash Commands`
- Choose the command name you want and click through
- In the `Outgoing Data` section, copy `token` and replace `[SLACK_WEBHOOK_TOKEN]` in your Google script
- Copy the URL from the last step in `Google` into the `URL` field
- Don't forget to modify the `Customize Name` and `Customize Icon`
- In `Autocomplete help text` it is useful to set the `Usage hint` to `help` so your end users know to type `help` for more information

### Back to Google
- In your script, go back to `Publish` -> `Deploy as Web app`
  - *Important* Make sure you select `New` in `Project version`, otherwise your changes will *not* be published!
