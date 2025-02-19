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

fs.createReadStream(inputFile)
  .pipe(csv())
  .on("data", (row) => {
    const country = row[Object.keys(row)[0]]
    const years = Object.keys(row).slice(1)

    const gdpValues = years.map((year) => {
      let value = row[year]
      return value === "no data" || value === "" ? 0 : parseFloat(value)
    })

    data.push({ country, years, gdpValues })
  })
  .on("end", () => {
    const percentageChangeData = []

    data.forEach(({ country, years, gdpValues }) => {
      const row = { country }

      for (let i = 1; i < gdpValues.length; i++) {
        if (gdpValues[i - 1] !== 0) {
          row[years[i]] = (((gdpValues[i] - gdpValues[i - 1]) / gdpValues[i - 1]) * 100).toFixed(4)
        } else {
          row[years[i]] = "0"
        }
      }

      percentageChangeData.push(row)
    })

    const csvWriter = createCsvWriter({
      path: outputFile,
      header: [
        { id: "country", title: "Country" },
        ...data[0].years.slice(1).map((year) => ({ id: year, title: year })),
      ],
    })

    csvWriter.writeRecords(percentageChangeData).then(() => {
      console.log("GDP percentage change file written successfully")
    })
  })
