import React, { Component } from 'react';
import { Table } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import './Graph.css';

/**
 * Props declaration for <Graph />
 */
interface IProps {
  data: ServerRespond[];
}

/**
 * Perspective library adds load to HTMLElement prototype.
 * This interface acts as a wrapper for Typescript compiler.
 */
interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void;
}

/**
 * React component that renders Perspective based on data
 * parsed from its parent through data property.
 */
class Graph extends Component<IProps, {}> {
  // Perspective table
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Simplified element assignment
    const elem = document.getElementsByTagName('perspective-viewer')[0] as PerspectiveViewerElement;

    const schema = {
      stock: 'string',
      top_ask_price: 'float',
      top_bid_price: 'float',
      timestamp: 'date',
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.
      elem.load(this.table);

      // Set additional attributes
      elem.setAttribute('view', 'y_line'); // To visualize the data as a continuous line graph
      elem.setAttribute('column-pivots', '["stock"]'); // To distinguish between different stocks
      elem.setAttribute('row-pivots', '["timestamp"]'); // To map each data point based on its timestamp on the x-axis
      elem.setAttribute('columns', '["top_ask_price"]'); // To focus on the top_ask_price along the y-axis
      elem.setAttribute('aggregates', JSON.stringify({
        stock: 'distinct count', // Handle duplicates by considering unique stock names
        top_ask_price: 'avg', // Average out top_ask_prices of similar data points
        top_bid_price: 'avg', // Average out top_bid_prices of similar data points
        timestamp: 'distinct count' // Handle duplicates by considering unique timestamps
      }));
    }
  }

  componentDidUpdate(prevProps: IProps) {
    // Avoid updating the table if the data hasn't changed
    if (this.props.data !== prevProps.data && this.table) {
      this.table.update(this.props.data.map((el: any) => {
        // Format the data from ServerRespond to the schema
        return {
          stock: el.stock,
          top_ask_price: (el.top_ask && el.top_ask.price) ? el.top_ask.price : 0,
          top_bid_price: (el.top_bid && el.top_bid.price) ? el.top_bid.price : 0,
          timestamp: el.timestamp,
        };
      }));
    }
  }
}

export default Graph;
