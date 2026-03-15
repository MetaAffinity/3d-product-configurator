import React from "react";
import shoe from "../img/shoe.png";
import rocket from "../img/rocket.png";
import axe from "../img/axe.png";
import insect from "../img/insect.png";
import teapot from "../img/teapot.png";
import sneaker from "../img/sneaker.png";
import poloshirt from "../img/demo.png";
import hoodie from "../img/hoodie.png";
import highnecktshirt from "../img/highnecktshirt.png";
import PoloShirt from "../img/poloshirt.png";

const ModelPicker = ({ updateSelectedModel }) => {
  return (
    <>
      <div className="model-selector">
        <div onClick={() => updateSelectedModel("Shoe")}>
          <img src={shoe} alt="shoe" />
          <h4>Shoe</h4>
        </div>
        {/* <div onClick={() => updateSelectedModel("Rocket")}>
          <img src={rocket} alt="rocket" />
          <h4>Rocket</h4>
        </div> */}
        {/* <div onClick={() => updateSelectedModel("Axe")}>
          <img src={axe} alt="axe" />
          <h4>Axe</h4>
        </div> */}
        {/* <div onClick={() => updateSelectedModel("Insect")}>
          <img src={insect} alt="insect" />
          <h4>Insect</h4>
        </div> */}
        <div onClick={() => updateSelectedModel("Teapot")}>
          <img src={teapot} alt="teapot" />
          <h4>Teapot</h4>
        </div>
        <div onClick={() => updateSelectedModel("Sneaker")}>
          <img src={sneaker} alt="sneaker" />
          <h4>Sneaker</h4>
        </div>
        <div onClick={() => updateSelectedModel("PoloShirt")}>
          <img src={PoloShirt} alt="poloshirt" />
          <h4>Polo Shirt</h4>
        </div>
        <div onClick={() => updateSelectedModel("HighNeckTshirt")}>
          <img src={highnecktshirt} alt="highneck" />
          <h4>HighNeck</h4>
        </div>
        <div onClick={() => updateSelectedModel("Hoodie")}>
          <img src={hoodie} alt="hoodie" />
          <h4>Hoodie</h4>
        </div>
      </div>
    </>
  );
};

export default ModelPicker;
