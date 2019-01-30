import React, { PureComponent } from 'react'

import "../prototype.scss";

//Dynamic left positioning inside Line Component
const Line = ({ left }) => {
    return(
        <div 
            className="line" 
            style={{ left: `${left}%` }}
        />
    )
}

const BarTextContent = ({ currencies }) => {
    return (
        <div className = "bar-text-content">
            {
                currencies.map((currency) => (
                    <div className="graphText">
                        {currency.currencyName}
                    </div>

                ))
            }
        </div>
    )
}

const Bar = ({ percent }) => {
    return (
      <div className="bar" style={{ width: `${percent}%` }} />
    )
  }

const Markers = () => {
    const markerArr = Array(11).fill(null);
    
    return (
      <div className="markers">
        {
          markerArr.map((el, i) => (
           <span className="marker" style={{ left: `${i * 10}%` }}>
            { i * 10 }
           </span>
          ))
        }
      </div>
    )
  }

export class AnalyticsView extends React.Component {

    state = {}

    renderLines() {
        return Array(10).fill(null).map((el, i) => (
            <Line
                left = {i * 10}
                key = {i}
            />
        ))
    }
 
    renderBars() {
        const { currencies } = this.props;
        
        let sumOfAllCurrencies = currencies.reduce((acc, currency) => {
          return acc + currency.marketCap;
        }, 0);
        
        return currencies.map((currency) => {
          const percent = (currency.marketCap / 100) * 100; 
        //   const percent = currency.marketCap; 
          return (
            <Bar 
              percent={percent}
              key={currency.currencyName}
            />
          )
        });
      }

  render() {
    return (
      <div className="graph-wrapper">
        <h2> { this.props.graphTitle  }</h2>

        <div className="graph">
            <BarTextContent currencies={this.props.currencies} />

            <div className="bar-lines-container">

                { this.renderLines() }
                { this.renderBars() }

            </div>

            <div style={{ width: '12%' }} />
            <Markers />      


        </div>

      </div>
    )
  }
}


