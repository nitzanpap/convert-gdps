const fs = require("fs")
const path = require("path")
const csv = require("csv-parser")
const createCsvWriter = require("csv-writer").createObjectCsvWriter

const inputDir = "input"
const distDir = "dist"

// Create directories if they don't exist
;[inputDir, distDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
})

// Find first CSV file in input directory
const inputFiles = fs.readdirSync(inputDir).filter((file) => file.endsWith(".csv"))
if (inputFiles.length === 0) {
  console.error("No CSV files found in input directory. Please add a CSV file to the input folder.")
  process.exit(1)
}

const inputFile = path.join(inputDir, inputFiles[0])
const outputFile = path.join(distDir, "gdp_percentage_change.csv")

const data = []

// Read the CSV file and process data
fs.createReadStream(inputFile)
  .pipe(csv())
  .on("data", (row) => {
    data.push(row)
  })
  .on("end", () => {
    console.log(`CSV file ${inputFile} successfully processed.`)

    // Extract headers: first key is Country, rest are year columns.
    const headers = Object.keys(data[0])
    const countryHeader = headers[0]
    const yearHeaders = headers.slice(1)

    // Compute GDP percentage change for each row (starting from second year)
    const outputData = data.map((row) => {
      let outRow = {}
      outRow[countryHeader] = row[countryHeader]
      for (let i = 1; i < yearHeaders.length; i++) {
        const prevYear = yearHeaders[i - 1]
        const currYear = yearHeaders[i]
        const prevVal = parseFloat(row[prevYear])
        const currVal = parseFloat(row[currYear])
        if (!isNaN(prevVal) && !isNaN(currVal) && prevVal !== 0) {
          outRow[currYear] = (((currVal - prevVal) / prevVal) * 100).toFixed(2)
        } else {
          outRow[currYear] = ""
        }
      }
      return outRow
    })

    // Create CSV header: country field and computed change fields (using current year as header).
    const outputHeaders = [
      { id: countryHeader, title: countryHeader },
      ...yearHeaders.slice(1).map((year) => ({ id: year, title: year })),
    ]

    const csvWriter = createCsvWriter({
      path: outputFile,
      header: outputHeaders,
    })

    csvWriter.writeRecords(outputData).then(() => console.log(`Output written to ${outputFile}`))
  })
