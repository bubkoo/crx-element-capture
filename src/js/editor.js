(function () {

  //var screenshot = chrome.extension.getBackgroundPage().screenshot;

  //console.log(screenshot)

  var data = [
    {
      dataURL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACgAAAAU0CAIAAACbldndAAAgAElEQVR4nOzdd5jU1b0/8DPbK52lCyKIiqAiCNhQURK7aGLDCLFi1CTiNfndxPSbm6rEmGiMJdZcNcYShdiIRgQ1BAQUlF4FXMouLCzb5/fHyDBsY4EF4vB6PfeP7zlzzpkzszyb+/jezzmRaDQaAAAAAAAAAPj8S9nfGwAAAAAAAACgeQiAAQAAAAAAAJKEABgAAAAAAAAgSQiAAQAAAAAAAJKEABgAAAAAAAAgSQiAAQAAAAAAAJKEABgAAAAAAAAgSQiAAQAAAAAAAJJE2v7eAMC+UFpaumTJkgULFqxbty49PT0SiWRkZGRmZrZv375jx44dO3bMy8vb33sEAAAAAADYUwJgIMnNnz//wQcf/OUvf9n4sAEDBowZM2b48OGHH354JBLZN3sDAAAAAABoXpFoNLq/9wCwV6xZs+b2229/8MEHd2lWfn7+M888M2LEiL20KwAAAAAAgL1HBTCQnN57770hQ4bsxsSSkpLNmzc3+34AAAAAAAD2ARXAQBJauHBh7969632pf//+hx12WElJyfTp0wsLC+sOKCgo+Pjjj1u3br2X9wgAAAAAAND8VAADyaaysvLyyy+v1VlQUPDHP/5x2LBhrVq1indWVFQUFxcvXLjwrbfeGj9+fCwPvuSSS6S/AAAAAADA55QKYCDZTJ069YQTTkjsueOOO77xjW+kpqY2PnHevHkPP/zwl770pWOPPXZvbhAAAAAAAGBvUQEMJJtXX301sXnTTTfdcsstkUhkpxP79Onzs5/9bK/tCwAAAAAAYK9L2d8bAGhO0Wh08eLF8WZBQcF3v/vdpqS/AAAAAAAASUAFMJBUSktLp0+fHm/m5eXl5eXtx/00r9LS0rKysthzTk5OVlZWU2Zt2rSpqqoqhJCampqbm5uW1py/+eOLp6Sk5OXlNWXx6urqzZs3V1dXx7aUl5e309O5m6K6urq8vDx2r0FaWlpqamrzftKKioqtW7dmZWWVlpZmZ2c38csHAAAAAIB9TAAMJLPjjjsuNze3WZYqKir6wx/+kJ6eHkIoLy8fMWLEoEGDmjKxqqrqwQcfLCkpiTV79+59/vnn1ztywoQJc+fOjUQiZWVlo0aNOvjgg2P9q1ateuGFFx599NF33303cfyZZ555+eWXf/GLX2zXrl3d1aZPn/70008//PDDhYWFif0XXXTRueeee9ZZZ7Vv377xnUej0QcffLC4uDiEUFFR8Y1vfCP+Zc6dO/fpp5++9957ay1+1VVXffnLXx42bFh2dnat1SoqKt56663HH3/8kUceqfXStddeO3LkyFNOOaXurMYVFRXNnj17ypQpU6dOnTBhQq1XzzzzzIsvvvj8889v3br1TpdK/PIvvfTSXr16xV+aMWPGgw8+eM899ySOv/TSSy+44ILly5fH6svLy8uvueaaDh06NH3z69atu++++zIzM2PNzp07X3bZZarVAQAAAADYQ5FYsRRAcqisrDz11FOnTJkSa/bs2XPWrFnNUgT88ccfH3744fHmnXfeecsttzRl4pYtW4477ri5c+fGmieddNIbb7xRb83rNddc8+CDD8ae//73v3/xi18sLS39yU9+8vOf/7zxt/jf//3fb33rW/E133vvvcsvvzzxKOx6PfbYY1dccUXjO+/fv39snfz8/A8//PCggw5auXLlVVdd9dprrzW++HPPPXfBBRfEm08++eRll13W+JSCgoIXX3zxuOOOa3xYzHvvvXfvvffWzZLr9fvf//76669vvM448cufNm3awIEDQwjr1q27+eabn3zyybrjzz333AEDBvzoRz+K9/zud7+78cYbm7KfmD//+c+jRo2KN2+++ebf/va3TZ8OAAAAAAD1cgcwkFTS09MHDBgQby5evHjRokXNsnKt+DAjI6PpExPPIu7UqVNDVZ45OTnx50WLFlVWVp5yyik7TX9DCN/5zne+/e1vx/6g5+mnnx4yZMhO098Qwle+8pUf/OAHjfwZUOx85thzSUnJhg0bli5d2q1bt52mvyGEkSNHPvvssyGEaDR666237jT9DSEUFhYOHjz4pZde2unIr3/960OGDGli+htCuPHGG4cNG7Z169ZGxiR++bG0fsmSJX379q03/Q0hHH/88V/5ylcSe377299WVlY2cUs1NTX3339/Ys/VV1/dxLkAAAAAANAIATCQbBKTvBDCd7/73dgltf8hGo8h4x555JExY8ZMmzatVn9+fn694++444433nhjypQpl1xySd1XG5r14x//+I033mjKfkIIv/nNb84+++y6/UcccUS948eMGbNq1arf/OY3d955Z9NnXX755WvWrGl8J/HDsevq379/4l8AxE2ZMmX8+PGNLxtXUVGxZcuW008/vdYB14ny8/N79ux50UUXxXvmz58/Y8aMJr7FokWL3nzzzXjz0EMP7du3bxPnAgAAAABAIwTAQLKpdazxhAkTbrnllurq6v21n90zbdq0P//5z7HngoKC5557btWqVZWVlZs2bYpGo8uXL//6179ea8rw4cNPPPHEeHPQoEETJ05cvXp1bFZVVdWiRYvqlpn+8Ic/bGJA/sgjj8QPsh45cuSbb765fv36qqqqOXPmVFVVzZw584wzzkgcX1JS0qVLl3HjxsV7brjhhnfeeaeoqCg2q6ysbNq0abWS4JKSkocffrjxnYwcOTL+XFBQMH78+GnTpq1bt66ysnLWrFnTp0/fuHHjn/70p1qz7rrrrtWrVzflkxYXF99+++2JVdTXXnvt1KlTV6xYsXTp0vfff/+xxx4788wzI5HI2LFjEyc+8cQTTVk/hDBx4sTE5re+9a3EMnEAAAAAANhtAmAg2fTt2/f8889P7Pnd7343dOjQmTNn7q8t7Ymbb775k08+ueCCCzp16hTPCLt163bXXXdNmDChoVl33nnnu+++e+aZZ3bs2DE2KzU1tWfPng888MDTTz+dOHLy5MnxWLeJHnvssWeffXbYsGFt2rSJnYydmpp61FFHvfLKK//7v//b0KxJkybdc889Q4YMadWqVWxWZmbmwIEDZ82adeuttyaOvP/++0tKShrZQPfu3S+66KKLLrpo5syZa9as+eY3vzlw4MC2bdvGv58WLVqMGTNm+fLlPXv2jM8qLCxs5BtLdNttt/3mN7+JPRcUFMyePfuPf/zj0KFDu3bt2r1796OPPvqKK66IrTx06NDEAPupp55au3btTtcvKyt76KGH4s38/PwRI0Y0ZWMAAAAAALBTAmAg2UQikbr35k6bNu2YY4658MIL//3vfzdy6+1/mquuumr8+PEN1YaeddZZP/vZz+r2//rXv77llltSUur/Df/lL3/55ptvTuyZPHly07f0wAMP1KqxjotEIt/+9rdPOOGEui/94x//OO200+qdlZaW9j//8z/9+/eP9yxevHjevHmN7CESiTz11FPPPPPMUUcd1dCFyiGEbt26/fGPf0zsmTVr1i799IcMGTJv3rx+/fo1NCA3N3f06NHxZmFh4VtvvbXTZT/66KPZs2fHm2effXaXLl2avisAAAAAAGiEABhIQocddti7775bt/+5554bNGhQx44dH3744SaeBrwf5efn33777bFi2YZceumltXp69ux53XXXNb5yrQGZmZlN3NKhhx565ZVXNjIgJSXlW9/6Vq3Oq6+++pRTTmlkVlZW1m233VZrncZ30vjXEnfCCScMGjQo3ly2bFlNTU1TJoYQevbsOXHixFatWjU+LPEa4BDCXXfdtdMjtV944YXE5ujRo3f6eQEAAAAAoIn8F2cgOQ0ePHjBggWJJwDHFRYWfvWrX+3cufMXv/jFt956q4k34O57Z555Zvfu3Rsf07Fjx1p36N544435+fmNz+rVq1dixe2kSZOaGIvedttt6enpjY85/PDDa/WMHj26kTrdmCFDhiQ233///absZ6eysrJqrbzTncTdf//9rVu33umwnj17JmbAkydPnj9/fiPjN23a9Nhjj8WbXbt2rbdmGgAAAAAAdo8AGEhavXr1+uCDD37yk580NOCVV14ZNmxYly5d/vznP1dUVOzLvTXFFVdcsdPC0MzMzOOOOy6x55xzztnpytXV1Ymx95YtW5pyMHJ+fv7w4cN3OqxDhw6JmXTPnj0HDhy401m1YviysrKdTtmrTjjhhJNPPrkpIyORyNixYxN7nn/++UbGv//++4sXL443r7rqqp0G9gAAAAAA0HQCYCCZ5eTk3H777UuWLPn+97/f0JjCwsJRo0Z169atuapOm0unTp12OiYSiSTGh127du3YseNOZ+Xk5Bx77LG11tnprOzs7J2ehxxCyMjISLy0+LjjjmvKEdMdOnSot1x7f/nxj3/c0NXLdQ0dOjQx837wwQdLSkrqHRmNRp9++unEnlonSAMAAAAAwB4SAAPJr0ePHj/60Y+2bNny2muvNZS3FRYWDhgwIPFs3v2roKCgR48euzqroqKiurp6p8MikUhTotxaBg8e3KJFi12d1cTy4uzs7Ly8vF1dPNGmTZsKCws//fTTTz75ZNmyZfPmzZszZ84HH3ywdu3a3Vitbdu2TR+cm5t7zTXXxJuLFy/+17/+Ve/I9evXP/PMM/HmCSecUOsEbwAAAAAA2ENNLW8C+LzLyck5/fTTTz/99MLCwmefffaGG26oO+bKK69ct27dLbfcsu+3V1dqauquTsnLy8vKytobmwkhZGdnN/0C3bju3bvv9CDr3VZYWPjOO++88sor9957bzMuW1BQcNBBB+3SlPPOO2/cuHHx5gMPPHDqqafW/eBTp04tLCyMN6+77rqm1xkDAAAAAEBTqAAGDjgFBQVjx44tKytLrMWMGzdu3KxZs/b9rprFwIEDm3Le8u7ZunXrbsw66qijdiM23qkZM2aMGTOmQ4cOF1xwQfOmv7unZ8+eicXlEyZM+O…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",
      dx: 0,
      dy: 0,
      height: 666,
      ratio: 2,
      sx: 205,
      sy: 0.03125,
      totalHeight: 1526,
      totalWidth: 870,
      width: 870
    },
    {
      dataURL: "data:image/png;base64,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…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",
      dx: 0,
      dy: 666,
      height: 666,
      ratio: 2,
      sx: 205,
      sy: 0.03125,
      totalHeight: 1526,
      totalWidth: 870,
      width: 870
    },
    {

      dataURL: "data:image/png;base64,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…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",
      dx: 0,
      dy: 1332,
      height: 194,
      ratio: 2,
      sx: 205,
      sy: 0.03125,
      totalHeight: 1526,
      totalWidth: 870,
      width: 870
    }];

  var canvas;
  var ctx;

  data.forEach(function (item) {

    if (!canvas) {
      canvas = document.createElement('canvas');
      document.body.appendChild(canvas);

      canvas.width  = item.totalWidth;
      canvas.height = item.totalHeight;

      ctx = canvas.getContext('2d');
    }

    var img = new Image();

    img.onload = function () {
      ctx.drawImage(img,
        item.sx,
        item.sy,
        item.width,
        item.height,
        item.dx,
        item.dy,
        item.width,
        item.height
      );
    };

    img.src = item.dataURL;
  });
})();
