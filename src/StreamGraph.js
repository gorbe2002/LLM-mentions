import React, { Component } from "react";
import * as d3 from "d3";

class StreamGraph extends Component {
  componentDidUpdate() {
    this.renderStreamGraph();
  }

  renderTooltipBarChart = (data, model, newColor, mouseX, mouseY) => {
    // check previous color
    if (!this.previousColor) this.previousColor = newColor;
    
    // set dimensions and margins
    const margin = { top: 20, right: 5, bottom: 40, left: 30 };
    const width = 250;
    const height = 150;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // create svg container
    const svg = d3.select(".tooltipBarchart")
      .attr("width", width)
      .attr("height", height)
      .select("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // create x and y scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d3.timeFormat("%b")(d.Date)))
      .range([0, innerWidth])
      .padding(0.1);
    const yScale = d3.scaleLinear().domain([0, d3.max(data, d => d[model])]).range([innerHeight, 0]);

    // add Barchart w/ transition
    svg.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => xScale(d3.timeFormat("%b")(d.Date)))
      .attr("y", d => yScale(d[model]))
      .attr("width", xScale.bandwidth())
      .attr("height", d => innerHeight - yScale(d[model]))
      .style("fill", this.previousColor)
      .transition()
      .duration(this.previousColor === newColor ? 0 : 500)
      .style("fill", newColor);

    // update previous color
    this.previousColor = newColor;

    // add x and axis
    svg.selectAll('.x.axis').data([null]).join('g').attr('class', 'x axis').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(xScale));
    svg.selectAll('.y.axis').data([null]).join('g').attr('class', 'y axis').call(d3.axisLeft(yScale).ticks(5));

    // center tooltip
    const tooltip = d3.select(".tooltipContainer");
    const tooltipWidth = 200 + margin.left + margin.right; 
    const tooltipHeight = 150 + margin.top + margin.bottom;
    tooltip
      .style("visibility", "visible")
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("border-radius", "4px")
      .style("padding", "10px")
      .style("pointer-events", "none")
      .style("top", `${mouseY - (tooltipHeight / 2)}px`)
      .style("left", `${mouseX - (tooltipWidth / 2)}px`);
  }

  renderStreamGraph = () => {
    // get data
    const data = this.props.csv_data;
    const models = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"];
    const colors = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"];
  
    // set dimensions and margins
    const margin = { top: 40, right: 130, bottom: 40, left: 40 };
    const width = 400;
    const height = 400;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
  
    // get max sum for y axis
    const maxSum = d3.sum([
      d3.max(data, d => d["GPT-4"]),
      d3.max(data, d => d["Gemini"]),
      d3.max(data, d => d["PaLM-2"]),
      d3.max(data, d => d["Claude"]),
      d3.max(data, d => d["LLaMA-3.1"])
    ]);
  
    // create svg container
    const svg = d3.select('.streamGraph')
      .attr('width', width)
      .attr('height', height)
      .select('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // create area stacks
    const stack = d3.stack().keys(models).offset(d3.stackOffsetWiggle);
    const stackedData = stack(data);
  
    // create x and y scales
    const xScale = d3.scaleTime().domain(d3.extent(data, d => d.Date)).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([0 - 100, maxSum]).range([innerHeight, 0]);
    
    // create area generation
    const areaGenerator = d3.area()
      .x(d => xScale(d.data.Date))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveCardinal);
  
    // display streamgraph
    svg.selectAll('path').data(stackedData).join('path')
      .style('fill', (d, i) => colors[i])
      .attr('d', d => areaGenerator(d))
      .on('mouseover', (event, d) => {
        const modelIndex = models.indexOf(d.key);
        const [mouseX, mouseY] = d3.pointer(event, document.body);
        this.renderTooltipBarChart(data, d.key, colors[modelIndex], mouseX, mouseY);
      })
      .on('mousemove', (event) => {
        const [mouseX, mouseY] = d3.pointer(event, document.body);
        const tooltipWidth = width / 2;
        const tooltipHeight = 150 + margin.top + margin.bottom;
        d3.select(".tooltipContainer")
          .style("top", `${mouseY - (tooltipHeight / 2)}px`)
          .style("left", `${mouseX - (tooltipWidth / 2)}px`);
      })
      .on('mouseout', () => {
        d3.select(".tooltipContainer").style("visibility", "hidden");
      });
  
    // add x-axis
    svg.selectAll('.x.axis').data([null]).join('g').attr('class', 'x axis')
      .attr('transform', `translate(0,${innerHeight + 10})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b")));
  
    // add legend
    const legend = d3.select('.streamGraph').append("g")
      .attr("transform", `translate(${width - margin.right + 40}, ${margin.top + (height / 2)})`);
  
    models.forEach((model, index) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${index * 20})`);
  
      legendRow.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", colors[colors.length - 1 - index]);
  
      legendRow.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .text(model)
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
    });
  }

  render() {
    return (
      <div style={{ position: "relative" }}>
        <svg className="streamGraph"><g></g></svg>
        <div className="tooltipContainer" style={{ visibility: "hidden" }}>
          <svg className="tooltipBarchart"><g></g></svg>
        </div>
      </div>
    );
  }
}

export default StreamGraph;