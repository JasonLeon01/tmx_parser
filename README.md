# tmx_parser
A parser of tmx files.
## Before we start
run 
```
npm install
```
to  install the packages we need.

## How to use it
We have two core code files in this project, `parser.ts` and `re-builder.ts`.

Run 
```
npx ts-node parser.ts
```
to generate `parser.json`, where all information is saved.

Then you can edit the event orders freely in event editor.

Then run
```
npx ts-node re-builder.ts
```
to generate a new tmx file from the `parser.json` to update event orders.