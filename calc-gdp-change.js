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
    const countryHeader = headers.find((header) => header.toLowerCase().includes("country"))
    const yearHeaders = headers.filter((header) => !isNaN(parseInt(header)))

    // Compute GDP percentage change while keeping original values.
    const outputData = data.map((row) => {
      let outRow = { ...row } // keep all original column values
      for (let i = 1; i < yearHeaders.length; i++) {
        const prevYear = yearHeaders[i - 1]
        const currYear = yearHeaders[i]
        const prevVal = parseFloat(row[prevYear])
        const currVal = parseFloat(row[currYear])
        let change = ""
        if (!isNaN(prevVal) && !isNaN(currVal) && prevVal !== 0) {
          change = (((currVal - prevVal) / prevVal) * 100).toFixed(2)
        }
        outRow[`${currYear}_change`] = change
      }
      return outRow
    })

    // Create CSV header: original columns + computed change columns.
    const outputHeaders = [
      { id: countryHeader, title: countryHeader },
      ...yearHeaders.map((year) => ({ id: year, title: year })),
      // make a separator between original and computed columns
      { id: "separator", title: "" },
      ...yearHeaders.slice(1).map((year) => ({ id: `${year}_change`, title: `${year}_change` })),
    ]

    const csvWriter = createCsvWriter({
      path: outputFile,
      header: outputHeaders,
    })

    csvWriter.writeRecords(outputData).then(() => console.log(`Output written to ${outputFile}`))
  })

/*

Examples:
Example row:{
  "1980": "no data",
  "1981": "no data",
  "1982": "no data",
  "1983": "no data",
  "1984": "no data",
  "1985": "no data",
  "1986": "no data",
  "1987": "no data",
  "1988": "no data",
  "1989": "no data",
  "1990": "no data",
  "1991": "no data",
  "1992": "no data",
  "1993": "no data",
  "1994": "no data",
  "1995": "no data",
  "1996": "no data",
  "1997": "no data",
  "1998": "no data",
  "1999": "no data",
  "2000": "no data",
  "2001": "no data",
  "2002": "4.367",
  "2003": "4.553",
  "2004": "5.146",
  "2005": "6.167",
  "2006": "6.925",
  "2007": "8.556",
  "2008": "10.297",
  "2009": "12.066",
  "2010": "15.325",
  "2011": "17.89",
  "2012": "20.293",
  "2013": "20.17",
  "2014": "20.616",
  "2015": "20.057",
  "2016": "18.02",
  "2017": "18.883",
  "2018": "18.336",
  "2019": "18.876",
  "2020": "20.136",
  "2021": "14.278",
  "2022": "14.501",
  "2023": "17.329",
  "2024": "no data",
  "2025": "no data",
  "2026": "no data",
  "2027": "no data",
  "2028": "no data",
  "2029": "no data",
  Country: "Afghanistan",
  "": "",
}

Example headers: [
  "1980",
  "1981",
  "1982",
  "1983",
  "1984",
  "1985",
  "1986",
  "1987",
  "1988",
  "1989",
  "1990",
  "1991",
  "1992",
  "1993",
  "1994",
  "1995",
  "1996",
  "1997",
  "1998",
  "1999",
  "2000",
  "2001",
  "2002",
  "2003",
  "2004",
  "2005",
  "2006",
  "2007",
  "2008",
  "2009",
  "2010",
  "2011",
  "2012",
  "2013",
  "2014",
  "2015",
  "2016",
  "2017",
  "2018",
  "2019",
  "2020",
  "2021",
  "2022",
  "2023",
  "2024",
  "2025",
  "2026",
  "2027",
  "2028",
  "2029",
  "Country",
  "",
]
*/
