import React from "react";
import { withStyles } from "@material-ui/core";

const style = {
  menubar: {
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start'
  },
}
const MenuItem = props => {
  return <div className="menu-item">{props.text}</div>;
};

const bStyle = {
  button: {
    width: '30px',
    height: '30px',
    borderRadius: '4px',
    transition: 'all 0.2s',
    padding: '5px',
    boxSizing: 'border-box',
    margin: '2px',

    '& svg': {
      fill: 'rgb(110, 110, 110)',
    },

    '&:hover': {
      backgroundColor: 'white',
      boxShadow: '0 5px 5px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(-1px)',
      transition: 'all 0.1s',


      '& svg': {
        fill: 'black',
      }
    },

    '&:active': {
      transform: 'translateY(0px)',
      opacity: '0.8',
    },
  },

}
const Button = props => {
  const style = {
    __html: props.image
  };

  const { classes } = props
  return (
    <div
      className={classes.button}
      dangerouslySetInnerHTML={style}
      onClick={e => props.handleClick(e, props.name)}
    />
  );
};
const StyledButton = withStyles(bStyle)(Button)

class MenuBar extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { classes } = this.props
    const items = this.props.items.map(item => (
      <StyledButton
        name={item.name}
        image={item.image}
        key={item.name}
        handleClick={item.func}
      />
    ));

    return <div className={classes.menubar}>{items}</div>;
  }
}

export default withStyles(style)(MenuBar)